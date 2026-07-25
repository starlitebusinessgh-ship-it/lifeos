"use client";

import { useCapture } from "./CaptureContext";
import { CaptureSheet } from "./CaptureSheet";

export function GlobalCapture() {
  const { captureOpen, captureDraft, closeCapture } = useCapture();
  return <CaptureSheet open={captureOpen} initial={captureDraft} onClose={closeCapture} />;
}
