"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export type ReaderTheme = "light" | "sepia" | "dark";

export type TextSelectionPayload = {
  text: string;
  page: number;
  rect: DOMRect;
};

type PdfReaderProps = {
  url: string;
  initialPage: number;
  jumpToPage?: number | null;
  theme?: ReaderTheme;
  zoom?: number;
  onPageChange: (page: number, totalPages: number) => void;
  onSelectionChange?: (selection: TextSelectionPayload | null) => void;
};

export function PdfReader({
  url,
  initialPage,
  jumpToPage,
  theme = "light",
  zoom = 1,
  onPageChange,
  onSelectionChange,
}: PdfReaderProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(Math.max(1, initialPage));
  const [error, setError] = useState<string | null>(null);
  const [width, setWidth] = useState(360);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const saveTimer = useRef<number | null>(null);
  const didScrollInitial = useRef(false);

  const pageWidth = Math.min(width * zoom, 720);

  useEffect(() => {
    function measure() {
      const w = containerRef.current?.clientWidth ?? window.innerWidth;
      setWidth(Math.min(w - 24, 480));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const reportPage = useCallback(
    (page: number, total: number) => {
      setCurrentPage(page);
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => onPageChange(page, total), 400);
    },
    [onPageChange]
  );

  useEffect(() => {
    if (!numPages || didScrollInitial.current) return;
    const target = Math.min(Math.max(1, initialPage), numPages);
    const el = pageRefs.current.get(target);
    if (el) {
      didScrollInitial.current = true;
      window.setTimeout(() => el.scrollIntoView({ block: "start" }), 80);
      setCurrentPage(target);
    }
  }, [numPages, initialPage]);

  useEffect(() => {
    if (!jumpToPage || !numPages) return;
    const target = Math.min(Math.max(1, jumpToPage), numPages);
    const el = pageRefs.current.get(target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentPage(target);
    }
  }, [jumpToPage, numPages]);

  useEffect(() => {
    if (!numPages) return;
    const root = containerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let best: { page: number; ratio: number } | null = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const page = Number((entry.target as HTMLElement).dataset.page);
          if (!page) continue;
          if (!best || entry.intersectionRatio > best.ratio) {
            best = { page, ratio: entry.intersectionRatio };
          }
        }
        if (best) reportPage(best.page, numPages);
      },
      { root, threshold: [0.35, 0.55, 0.75] }
    );

    for (const el of pageRefs.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, [numPages, reportPage]);

  const readSelection = useCallback(() => {
    if (!onSelectionChange) return;

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !containerRef.current) {
      onSelectionChange(null);
      return;
    }

    const text = sel.toString().trim();
    if (text.length < 2) {
      onSelectionChange(null);
      return;
    }

    const anchor = sel.anchorNode;
    if (!anchor || !containerRef.current.contains(anchor)) {
      onSelectionChange(null);
      return;
    }

    const el =
      anchor instanceof Element
        ? anchor.closest("[data-page]")
        : anchor.parentElement?.closest("[data-page]");
    const page = el ? Number((el as HTMLElement).dataset.page) : currentPage;
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    onSelectionChange({ text, page, rect });
  }, [currentPage, onSelectionChange]);

  function scrollToPage(page: number) {
    const el = pageRefs.current.get(page);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clearSelection() {
    window.getSelection()?.removeAllRanges();
    onSelectionChange?.(null);
  }

  return (
    <div
      className={`ln-reader-doc ln-reader-doc--${theme}`}
      ref={containerRef}
      onMouseUp={readSelection}
      onTouchEnd={readSelection}
    >
      {error && <p className="ln-reader-error">{error}</p>}
      <Document
        file={url}
        loading={<div className="ln-reader-loading">Opening book…</div>}
        onLoadSuccess={({ numPages: n }) => {
          setNumPages(n);
          if (initialPage <= 1) reportPage(1, n);
        }}
        onLoadError={() => setError("Could not load this PDF. Try re-uploading.")}
      >
        {Array.from({ length: numPages }, (_, i) => {
          const pageNum = i + 1;
          return (
            <div
              key={pageNum}
              className="ln-reader-page-wrap"
              data-page={pageNum}
              ref={(el) => {
                if (el) pageRefs.current.set(pageNum, el);
              }}
              onMouseDown={() => {
                if (window.getSelection()?.toString()) {
                  window.setTimeout(() => {
                    if (!window.getSelection()?.toString().trim()) {
                      onSelectionChange?.(null);
                    }
                  }, 0);
                }
              }}
            >
              <Page
                pageNumber={pageNum}
                width={pageWidth}
                renderTextLayer
                renderAnnotationLayer={false}
                loading={<div className="ln-reader-page-skel" />}
              />
              <span className="ln-reader-page-num">{pageNum}</span>
            </div>
          );
        })}
      </Document>

      {numPages > 0 && (
        <div className="ln-reader-scrub">
          <input
            type="range"
            min={1}
            max={numPages}
            value={currentPage}
            aria-label="Page"
            onChange={(e) => {
              clearSelection();
              scrollToPage(Number(e.target.value));
            }}
          />
          <span>
            {currentPage} / {numPages}
          </span>
        </div>
      )}
    </div>
  );
}
