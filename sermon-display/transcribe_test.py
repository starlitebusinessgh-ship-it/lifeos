#!/usr/bin/env python3
"""
Live microphone transcription latency test (Phase 3).

If faster-whisper isn't installed, run:
  pip install faster-whisper sounddevice numpy

This script is intentionally standalone — it does NOT talk to the FastAPI backend.
Speak into your mic and watch console latency between speech and text.
Stop with Ctrl+C.
"""

from __future__ import annotations

import queue
import sys
import time
from datetime import datetime

import numpy as np
import sounddevice as sd
from faster_whisper import WhisperModel

# Force UTF-8 console output on Windows so dashes/text don't garble.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# --- tunable knobs (latency testing) ---
MODEL_SIZE = "base"  # try "small" if base is too inaccurate; avoid "large" for now
SAMPLE_RATE = 16_000
WINDOW_SECONDS = 3.0  # shorter window = snappier feedback while testing
CHANNELS = 1
COMPUTE_TYPE = "int8"  # fast on CPU; use "float16" if you have a CUDA GPU
# None = default input. On this machine, try 11 for Realtek mic if array is quiet.
DEVICE = None
# VAD was dropping speech on quiet laptop mics — off for latency testing.
USE_VAD = False
MIN_RMS_TO_TRANSCRIBE = 0.003  # skip near-silent windows


def timestamp() -> str:
    return datetime.now().strftime("%H:%M:%S.%f")[:-3]


def pick_input_device() -> int | None:
    if DEVICE is not None:
        return DEVICE
    default = sd.default.device
    # sounddevice may return (input, output), list, or an InputOutputPair
    try:
        input_idx = default[0]
    except Exception:
        input_idx = default
    if input_idx is None:
        return None
    return int(input_idx)


def main() -> int:
    device = pick_input_device()
    try:
        info = sd.query_devices(device, "input")
        device_name = info["name"]
        max_in = int(info["max_input_channels"])
    except Exception as exc:
        print(f"[{timestamp()}] Could not open input device {device}: {exc}", file=sys.stderr)
        print("Available devices:", file=sys.stderr)
        print(sd.query_devices(), file=sys.stderr)
        return 1

    channels = min(CHANNELS, max_in) if max_in > 0 else CHANNELS

    print(f"[{timestamp()}] Loading Whisper model '{MODEL_SIZE}' ({COMPUTE_TYPE})...")
    t0 = time.perf_counter()
    model = WhisperModel(MODEL_SIZE, device="cpu", compute_type=COMPUTE_TYPE)
    print(f"[{timestamp()}] Model ready in {time.perf_counter() - t0:.1f}s")
    print(f"[{timestamp()}] Mic: [{device}] {device_name} ({channels} ch)")
    print(f"[{timestamp()}] Capture: {WINDOW_SECONDS:.0f}s windows @ {SAMPLE_RATE} Hz")
    print(f"[{timestamp()}] Speak clearly into the laptop mic. Ctrl+C to stop.\n")

    audio_q: queue.Queue[np.ndarray] = queue.Queue()
    blocksize = int(SAMPLE_RATE * 0.25)

    def on_audio(indata: np.ndarray, frames: int, time_info, status) -> None:  # noqa: ARG001
        if status:
            print(f"[{timestamp()}] audio status: {status}", file=sys.stderr)
        # Mix down to mono if the device gives multiple channels
        if indata.ndim > 1 and indata.shape[1] > 1:
            mono = indata.mean(axis=1)
        else:
            mono = indata.reshape(-1)
        audio_q.put(mono.copy())

    buffer = np.zeros(0, dtype=np.float32)
    samples_needed = int(SAMPLE_RATE * WINDOW_SECONDS)

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
                chunk = audio_q.get()
                buffer = np.concatenate([buffer, chunk.astype(np.float32, copy=False)])

                if len(buffer) < samples_needed:
                    continue

                window = buffer[-samples_needed:]
                buffer = buffer[-(samples_needed // 2) :]

                rms = float(np.sqrt(np.mean(np.square(window))))
                peak = float(np.max(np.abs(window)))

                if rms < MIN_RMS_TO_TRANSCRIBE:
                    print(
                        f"[{timestamp()}] quiet (rms={rms:.4f} peak={peak:.4f}) "
                        f"- speak louder / check mic"
                    )
                    continue

                speak_end = time.perf_counter()
                segments, info = model.transcribe(
                    window,
                    language="en",
                    beam_size=1,
                    vad_filter=USE_VAD,
                    without_timestamps=True,
                )
                text = " ".join(seg.text.strip() for seg in segments).strip()
                latency_ms = (time.perf_counter() - speak_end) * 1000

                if text:
                    print(
                        f"[{timestamp()}] ({latency_ms:.0f}ms | "
                        f"rms={rms:.4f}) {text}"
                    )
                else:
                    print(
                        f"[{timestamp()}] ({latency_ms:.0f}ms | "
                        f"rms={rms:.4f}) [heard sound, no words]"
                    )

    except KeyboardInterrupt:
        print(f"\n[{timestamp()}] Stopped.")
        return 0
    except Exception as exc:
        print(f"\n[{timestamp()}] Error: {exc}", file=sys.stderr)
        print(
            "Hint: pip install faster-whisper sounddevice numpy",
            file=sys.stderr,
        )
        print("Tip: set DEVICE = 11 near the top for Realtek mic.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
