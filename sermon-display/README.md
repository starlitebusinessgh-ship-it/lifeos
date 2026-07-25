# Sermon Display

Real-time church Bible display: FastAPI backend + Next.js operator/projector UI.

## Prerequisites

1. Python 3.11+ with Phase 1 data built (`data/bible.db`)
2. Node.js 20+

## 1. Start the API

```powershell
cd c:\lifeos\sermon-display
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Confirm startup shows the DB connected and 5 translations loaded.

## 2. Start the frontend

```powershell
cd c:\lifeos\sermon-display\frontend
npm install
npm run dev
```

Open:

- **Operator (media team):** http://localhost:3000/operator
- **Projector display:** http://localhost:3000/display — full-screen (F11) on the second monitor

## How it works

1. Operator looks up a verse (or leaves verse blank for a full chapter) and clicks **Push to Display**
2. Backend broadcasts over WebSocket (`/ws/display`)
3. `/display` updates in real time; operator page shows a live preview of the same feed
4. **Clear Display** blanks the projector

## Env (optional)

Defaults point at local FastAPI. Override if needed:

```
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8000/ws/display
```

## API docs

http://127.0.0.1:8000/docs

## Live transcription latency test (Phase 3)

Standalone — not wired into the backend yet:

```powershell
cd c:\lifeos\sermon-display
pip install faster-whisper sounddevice numpy
python transcribe_test.py
```

Speak into the mic; each ~4s window prints with a timestamp and inference time.
Ctrl+C to stop. Switch `MODEL_SIZE` in the script between `"base"` and `"small"` as needed.

## Scripture detection (Phase 4)

```powershell
cd c:\lifeos\sermon-display
python -m unittest test_scripture_detector.py -v
```

`scripture_detector.detect_references(text)` pulls book/chapter/verse out of messy
spoken transcripts (word numbers, First/Second prefixes, light fuzzy book names).
`detect_quote()` is stubbed for later.

## Live pipeline (mic → detect → display)

With the FastAPI backend already running:

```powershell
cd c:\lifeos\sermon-display
python -u live_pipeline.py
```

Speaks refs into the mic; high-confidence hits auto-push to `/display`.
Default translation is `KJV` (constant at top of `live_pipeline.py`).
