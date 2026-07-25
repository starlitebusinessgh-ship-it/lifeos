#!/usr/bin/env python3
"""
Live sermon pipeline: mic → Whisper → scripture detect → push to display.

Prereqs:
  1) FastAPI backend running:  python -m uvicorn main:app --host 127.0.0.1 --port 8000
  2) pip install faster-whisper sounddevice numpy requests

Stop with Ctrl+C.
"""

from __future__ import annotations

import queue
import sys
import threading
import time
from collections import deque
from datetime import datetime

import numpy as np
import requests
import sounddevice as sd
from faster_whisper import WhisperModel

from books import BOOKS
from scripture_detector import detect_references

# Force UTF-8 console output on Windows.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# --- easy knobs ---
DEFAULT_TRANSLATION = "KJV"  # change later (NKJV, NLT, AMP, MSG, …)
API_BASE = "http://127.0.0.1:8000"

# "small" is a big accuracy jump over "base" and still runs on CPU near real time.
# Bump to "medium" if the church PC is fast enough and you want even fewer mishears.
MODEL_SIZE = "small"
SAMPLE_RATE = 16_000
CHANNELS = 1
COMPUTE_TYPE = "int8"
DEVICE = None
MIN_RMS_TO_TRANSCRIBE = 0.003

# --- utterance segmentation (transcribe whole phrases, not fixed windows) ---
BLOCK_SECONDS = 0.25           # audio callback granularity
SILENCE_HANG_SECONDS = 0.7     # pause length that ends an utterance
MIN_UTTERANCE_SECONDS = 0.4    # ignore tiny blips
MAX_UTTERANCE_SECONDS = 14.0   # force-flush runaway speech
PREROLL_SECONDS = 0.3          # keep a little audio before speech starts

# --- domain biasing: we only care about Bible references ---
# Feeding book names as hotwords + a scripture-style prompt dramatically improves
# accuracy on a small model, because the vocabulary is tiny and constrained.
BOOK_HOTWORDS = " ".join(book.name for book in BOOKS)
INITIAL_PROMPT = (
    "Scripture reference from the Holy Bible. "
    "Books include Genesis, Exodus, Psalms, Isaiah, Matthew, Mark, Luke, John, "
    "Acts, Romans, First Corinthians, Second Corinthians, Galatians, Ephesians, "
    "Philippians, Hebrews, James, First Peter, Revelation. "
    "For example: Let us turn to John chapter three verse sixteen. "
    "Romans chapter eight verse twenty-eight."
)

# Detection / push policy
AUTO_PUSH_CONFIDENCE = 0.75
MIN_PUSH_CONFIDENCE = 0.55
SOFT_CONFIRM_SECONDS = 3.0
DEDUP_SECONDS = 20.0
CHUNK_HISTORY = 2  # combine with last N chunks for split refs
REQUEST_TIMEOUT = 3.0


def timestamp() -> str:
    return datetime.now().strftime("%H:%M:%S.%f")[:-3]


def pick_input_device() -> int | None:
    if DEVICE is not None:
        return DEVICE
    default = sd.default.device
    try:
        input_idx = default[0]
    except Exception:
        input_idx = default
    if input_idx is None:
        return None
    return int(input_idx)


def ref_key(ref: dict) -> tuple:
    return (
        ref["book"],
        int(ref["chapter"]),
        ref.get("verse"),
        ref.get("verse_end"),
    )


def format_ref(ref: dict) -> str:
    book = ref["book"]
    chapter = ref["chapter"]
    verse = ref.get("verse")
    verse_end = ref.get("verse_end")
    if verse is None:
        return f"{book} {chapter}"
    if verse_end is not None:
        return f"{book} {chapter}:{verse}-{verse_end}"
    return f"{book} {chapter}:{verse}"


def push_reference(ref: dict) -> tuple[bool, str]:
    """POST to /push or /push/chapter. Returns (ok, detail)."""
    translation = DEFAULT_TRANSLATION
    book = ref["book"]
    chapter = int(ref["chapter"])
    verse = ref.get("verse")

    try:
        if verse is None:
            url = f"{API_BASE}/push/chapter"
            body = {
                "translation": translation,
                "book": book,
                "chapter": chapter,
            }
        else:
            url = f"{API_BASE}/push"
            body = {
                "translation": translation,
                "book": book,
                "chapter": chapter,
                "verse": int(verse),
            }

        res = requests.post(url, json=body, timeout=REQUEST_TIMEOUT)
        if res.status_code >= 400:
            try:
                detail = res.json().get("detail", res.text)
            except Exception:
                detail = res.text
            return False, f"HTTP {res.status_code}: {detail}"
        return True, "pushed"
    except requests.exceptions.ConnectionError:
        return False, (
            f"backend not reachable at {API_BASE} — "
            "start uvicorn, pipeline will keep trying"
        )
    except requests.exceptions.Timeout:
        return False, "backend request timed out"
    except requests.exceptions.RequestException as exc:
        return False, f"request error: {exc}"


def soft_confirm(ref: dict, confidence: float) -> bool:
    """
    Soft-confirm for medium confidence.
    Enter → push now; wait SOFT_CONFIRM_SECONDS → auto-push.
    Returns True (always push after window — safety net, not a veto UI).
    """
    label = format_ref(ref)
    print(
        f"[{timestamp()}] Detected {label} (confidence {confidence:.2f}) — "
        f"press Enter to push, or wait {SOFT_CONFIRM_SECONDS:.0f}s to auto-push"
    )

    confirmed = threading.Event()

    def _wait_enter() -> None:
        try:
            sys.stdin.readline()
            confirmed.set()
        except Exception:
            pass

    waiter = threading.Thread(target=_wait_enter, daemon=True)
    waiter.start()
    confirmed.wait(timeout=SOFT_CONFIRM_SECONDS)
    if confirmed.is_set():
        print(f"[{timestamp()}] confirmed — pushing now")
    else:
        print(f"[{timestamp()}] auto-push after {SOFT_CONFIRM_SECONDS:.0f}s")
    return True


class Deduper:
    def __init__(self, cooldown: float) -> None:
        self.cooldown = cooldown
        self._last: dict[tuple, float] = {}

    def should_skip(self, key: tuple) -> bool:
        now = time.monotonic()
        prev = self._last.get(key)
        if prev is not None and (now - prev) < self.cooldown:
            return True
        return False

    def mark(self, key: tuple) -> None:
        self._last[key] = time.monotonic()


def best_refs_from_texts(texts: list[str]) -> list[dict]:
    """Run detect_references on each text; keep highest-confidence per ref key."""
    best: dict[tuple, dict] = {}
    for text in texts:
        if not text or not text.strip():
            continue
        for ref in detect_references(text):
            key = ref_key(ref)
            prev = best.get(key)
            if prev is None or ref["confidence"] > prev["confidence"]:
                best[key] = ref
    return sorted(best.values(), key=lambda r: r["confidence"], reverse=True)


def handle_detections(
    chunk_text: str,
    combined_text: str,
    deduper: Deduper,
) -> None:
    refs = best_refs_from_texts([chunk_text, combined_text])

    if not refs:
        print(
            f"[{timestamp()}] detect | chunk={chunk_text!r} | "
            f"combined={combined_text!r} | refs=none | pushed=no"
        )
        return

    for ref in refs:
        key = ref_key(ref)
        conf = float(ref["confidence"])
        label = format_ref(ref)

        if conf < MIN_PUSH_CONFIDENCE:
            print(
                f"[{timestamp()}] detect | chunk={chunk_text!r} | "
                f"ref={label} | conf={conf:.2f} | pushed=no (below threshold)"
            )
            continue

        if deduper.should_skip(key):
            print(
                f"[{timestamp()}] detect | chunk={chunk_text!r} | "
                f"ref={label} | conf={conf:.2f} | pushed=no (dedup {DEDUP_SECONDS:.0f}s)"
            )
            continue

        if conf >= AUTO_PUSH_CONFIDENCE:
            print(
                f"[{timestamp()}] detect | chunk={chunk_text!r} | "
                f"ref={label} | conf={conf:.2f} | action=auto-push"
            )
            ok, detail = push_reference(ref)
            if ok:
                deduper.mark(key)
                print(f"[{timestamp()}] PUSHED {label} ({DEFAULT_TRANSLATION}) — {detail}")
            else:
                print(f"[{timestamp()}] PUSH FAILED {label} — {detail}")
        else:
            print(
                f"[{timestamp()}] detect | chunk={chunk_text!r} | "
                f"ref={label} | conf={conf:.2f} | action=soft-confirm"
            )
            soft_confirm(ref, conf)
            ok, detail = push_reference(ref)
            if ok:
                deduper.mark(key)
                print(f"[{timestamp()}] PUSHED {label} ({DEFAULT_TRANSLATION}) — {detail}")
            else:
                print(f"[{timestamp()}] PUSH FAILED {label} — {detail}")


def transcribe_utterance(model: WhisperModel, audio: np.ndarray) -> str:
    """Transcribe one utterance with Bible-domain biasing."""
    try:
        segments, _info = model.transcribe(
            audio,
            language="en",
            beam_size=5,  # utterances are short; a wider beam is affordable + more accurate
            vad_filter=False,  # we already segmented on silence ourselves
            without_timestamps=True,
            hotwords=BOOK_HOTWORDS,
            initial_prompt=INITIAL_PROMPT,
            condition_on_previous_text=False,
        )
    except TypeError:
        # Older faster-whisper without hotwords= support
        segments, _info = model.transcribe(
            audio,
            language="en",
            beam_size=5,
            vad_filter=False,
            without_timestamps=True,
            initial_prompt=INITIAL_PROMPT,
            condition_on_previous_text=False,
        )
    return " ".join(seg.text.strip() for seg in segments).strip()


def check_backend() -> None:
    try:
        res = requests.get(f"{API_BASE}/health", timeout=REQUEST_TIMEOUT)
        if res.ok:
            data = res.json()
            print(
                f"[{timestamp()}] backend ok — translations="
                f"{data.get('translations')} clients={data.get('clients')}"
            )
        else:
            print(f"[{timestamp()}] backend responded HTTP {res.status_code}")
    except requests.exceptions.ConnectionError:
        print(
            f"[{timestamp()}] WARNING: backend not running at {API_BASE}. "
            "Start it with: python -m uvicorn main:app --host 127.0.0.1 --port 8000"
        )
    except requests.exceptions.RequestException as exc:
        print(f"[{timestamp()}] WARNING: backend check failed: {exc}")


def main() -> int:
    device = pick_input_device()
    try:
        info = sd.query_devices(device, "input")
        device_name = info["name"]
        max_in = int(info["max_input_channels"])
    except Exception as exc:
        print(f"[{timestamp()}] Could not open input device {device}: {exc}", file=sys.stderr)
        print(sd.query_devices(), file=sys.stderr)
        return 1

    channels = min(CHANNELS, max_in) if max_in > 0 else CHANNELS

    print(f"[{timestamp()}] Live pipeline starting")
    print(f"[{timestamp()}] translation={DEFAULT_TRANSLATION} api={API_BASE}")
    check_backend()

    print(f"[{timestamp()}] Loading Whisper model '{MODEL_SIZE}' ({COMPUTE_TYPE})...")
    t0 = time.perf_counter()
    model = WhisperModel(MODEL_SIZE, device="cpu", compute_type=COMPUTE_TYPE)
    print(f"[{timestamp()}] Model ready in {time.perf_counter() - t0:.1f}s")
    print(f"[{timestamp()}] Mic: [{device}] {device_name} ({channels} ch)")
    print(
        f"[{timestamp()}] Capture: utterance mode (flush after "
        f"{SILENCE_HANG_SECONDS:.1f}s pause) @ {SAMPLE_RATE} Hz"
    )
    print(
        f"[{timestamp()}] Auto-push >= {AUTO_PUSH_CONFIDENCE:.2f}; "
        f"soft-confirm {MIN_PUSH_CONFIDENCE:.2f}–{AUTO_PUSH_CONFIDENCE:.2f}; "
        f"dedup {DEDUP_SECONDS:.0f}s"
    )
    print(f"[{timestamp()}] Speak scripture refs. Ctrl+C to stop.\n")

    audio_q: queue.Queue[np.ndarray] = queue.Queue()
    blocksize = int(SAMPLE_RATE * BLOCK_SECONDS)
    transcript_chunks: deque[str] = deque(maxlen=CHUNK_HISTORY)
    deduper = Deduper(DEDUP_SECONDS)

    def on_audio(indata: np.ndarray, frames: int, time_info, status) -> None:  # noqa: ARG001
        if status:
            print(f"[{timestamp()}] audio status: {status}", file=sys.stderr)
        if indata.ndim > 1 and indata.shape[1] > 1:
            mono = indata.mean(axis=1)
        else:
            mono = indata.reshape(-1)
        audio_q.put(mono.copy())

    # Utterance accumulator
    preroll: deque[np.ndarray] = deque(
        maxlen=max(1, int(PREROLL_SECONDS / BLOCK_SECONDS))
    )
    speech: list[np.ndarray] = []
    in_speech = False
    silence_run = 0.0
    speech_len = 0.0

    def flush_utterance() -> None:
        nonlocal speech, in_speech, silence_run, speech_len
        if not speech:
            speech, in_speech, silence_run, speech_len = [], False, 0.0, 0.0
            return
        audio = np.concatenate(speech)
        speech, in_speech, silence_run, speech_len = [], False, 0.0, 0.0

        if len(audio) < int(MIN_UTTERANCE_SECONDS * SAMPLE_RATE):
            return

        t_infer = time.perf_counter()
        text = transcribe_utterance(model, audio)
        latency_ms = (time.perf_counter() - t_infer) * 1000

        if not text:
            print(f"[{timestamp()}] transcript | ({latency_ms:.0f}ms) [no words]")
            return

        print(f"[{timestamp()}] transcript | ({latency_ms:.0f}ms) {text}")
        prior = " ".join(transcript_chunks).strip()
        combined = f"{prior} {text}".strip() if prior else text
        handle_detections(text, combined, deduper)
        transcript_chunks.append(text)

    try:
        with sd.InputStream(
            samplerate=SAMPLE_RATE,
            channels=channels,
            dtype="float32",
            blocksize=blocksize,
            device=device,
            callback=on_audio,
        ):
            while True:
                block = audio_q.get()
                block = block.astype(np.float32, copy=False)
                block_dur = len(block) / SAMPLE_RATE
                rms = float(np.sqrt(np.mean(np.square(block)))) if len(block) else 0.0
                voiced = rms >= MIN_RMS_TO_TRANSCRIBE

                if not in_speech:
                    preroll.append(block)
                    if voiced:
                        in_speech = True
                        speech = list(preroll)  # include a little lead-in
                        speech.append(block)
                        speech_len = block_dur * len(speech)
                        silence_run = 0.0
                    continue

                # in speech
                speech.append(block)
                speech_len += block_dur
                if voiced:
                    silence_run = 0.0
                else:
                    silence_run += block_dur
                    if silence_run >= SILENCE_HANG_SECONDS:
                        flush_utterance()
                        continue

                if speech_len >= MAX_UTTERANCE_SECONDS:
                    flush_utterance()

    except KeyboardInterrupt:
        print(f"\n[{timestamp()}] Stopping — closing mic…")
        return 0
    except Exception as exc:
        print(f"\n[{timestamp()}] Error: {exc}", file=sys.stderr)
        print(
            "Hint: pip install faster-whisper sounddevice numpy requests",
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
