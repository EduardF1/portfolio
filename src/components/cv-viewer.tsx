"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { blockCopyShortcuts } from "@/lib/cv-viewer-keyblock";

/** PDF.js types are large and we only touch a tiny surface of the API. */
type PdfPage = {
  getViewport: (opts: { scale: number }) => { width: number; height: number };
  render: (opts: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void>; cancel?: () => void };
  cleanup?: () => void;
};

type PdfDoc = {
  numPages: number;
  getPage: (n: number) => Promise<PdfPage>;
  destroy?: () => Promise<void>;
};

type CvLang = "en" | "da";

export type CvLabels = {
  english: string;
  danish: string;
  loading: string;
  loadError: string;
  prev: string;
  next: string;
  /**
   * Template string with `{current}` and `{total}` placeholders, e.g.
   * "Page {current} of {total}". Client substitutes at render time.
   * Was a function previously, but functions can't cross the server→client
   * boundary in RSC — that produced a runtime 500 in production.
   */
  pageOfTemplate: string;
  readonlyNote: string;
  directDownload: string;
};

function formatPageOf(template: string, current: number, total: number) {
  return template
    .replace("{current}", String(current))
    .replace("{total}", String(total));
}

const PDF_WORKER_SRC = "/pdf/pdf.worker.min.mjs";

export function CvViewer({
  pdfUrl,
  lang,
  labels,
}: {
  pdfUrl: string;
  lang: CvLang;
  labels: CvLabels;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const docRef = useRef<PdfDoc | null>(null);
  // The pdfUrl key is captured at load-resolve time so we can drop stale
  // results when a fast language-switch is in flight. This also lets us
  // derive the per-load state without setState-in-effect-body churn.
  const [docState, setDocState] = useState<{
    url: string;
    status: "loading" | "ready" | "error";
    numPages: number;
  }>({ url: pdfUrl, status: "loading", numPages: 0 });
  const [pageIndex, setPageIndex] = useState(1);
  const status = docState.url === pdfUrl ? docState.status : "loading";
  const numPages = docState.url === pdfUrl ? docState.numPages : 0;

  // Reset the page counter when the document changes — derived from the
  // pdfUrl prop, no setState-in-effect-body required.
  if (docState.url !== pdfUrl && pageIndex !== 1) {
    setPageIndex(1);
  }

  // Load the document once per pdfUrl.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // pdfjs-dist is a browser-only ESM bundle; dynamic-import keeps it
        // out of the SSR graph entirely.
        const pdfjs = await import("pdfjs-dist");
        // Worker is served from /pdf on our own origin (synced by
        // scripts/sync-pdfjs-worker.mjs).
        pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;

        const loadingTask = pdfjs.getDocument({ url: pdfUrl });
        const doc = (await loadingTask.promise) as unknown as PdfDoc;
        if (cancelled) {
          await doc.destroy?.();
          return;
        }
        docRef.current = doc;
        setDocState({
          url: pdfUrl,
          status: "ready",
          numPages: doc.numPages,
        });
      } catch (err) {
        // Hide the noisy stack from end-users; surface our localised error.
        console.error("[cv-viewer] failed to load PDF", err);
        if (!cancelled) {
          setDocState({ url: pdfUrl, status: "error", numPages: 0 });
        }
      }
    })();

    return () => {
      cancelled = true;
      const d = docRef.current;
      docRef.current = null;
      d?.destroy?.();
    };
  }, [pdfUrl]);

  // Render the current page to canvas whenever pageIndex / doc changes.
  useEffect(() => {
    if (status !== "ready") return;
    const doc = docRef.current;
    const canvas = canvasRef.current;
    if (!doc || !canvas) return;

    let cancelled = false;
    let renderTask: { promise: Promise<void>; cancel?: () => void } | null =
      null;

    (async () => {
      try {
        const page = await doc.getPage(pageIndex);
        if (cancelled) return;

        // Match the device pixel ratio so the canvas stays crisp on retina
        // displays. Cap at 2 to keep the bitmap from getting pathologically
        // large on very-high-DPI monitors.
        const dpr = Math.min(
          typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
          2,
        );
        // Pick a base scale that fits ~A4 width into the container; the
        // canvas is then CSS-scaled responsive via max-width:100%.
        const baseScale = 1.5;
        const viewport = page.getViewport({ scale: baseScale * dpr });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        // CSS size so it shrinks on small screens.
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        // Wipe before re-render to avoid ghosting on page change.
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        renderTask = page.render({ canvasContext: ctx, viewport });
        await renderTask.promise;
      } catch (err) {
        // RenderingCancelledException is normal when a fast page-flip
        // aborts an in-flight render; ignore it.
        const name = (err as { name?: string } | null)?.name;
        if (name === "RenderingCancelledException") return;
        console.error("[cv-viewer] render failed", err);
      }
    })();

    return () => {
      cancelled = true;
      renderTask?.cancel?.();
    };
  }, [pageIndex, status]);

  // Keyboard handling — block copy/devtools shortcuts; allow arrow-key paging.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (blockCopyShortcuts(e)) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        setPageIndex((p) => Math.min(p + 1, numPages || p));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        setPageIndex((p) => Math.max(p - 1, 1));
      }
    },
    [numPages],
  );

  // Right-click swallowed on the canvas wrapper; the rest of the page works.
  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div
      className="mt-10 flex flex-col items-center gap-6"
      data-testid="cv-viewer"
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      {/* Language switch — keeps the user inside the viewer. */}
      <div
        className="flex items-center gap-2 self-start"
        role="tablist"
        aria-label="CV language"
      >
        <Link
          href={{ pathname: "/cv", query: { lang: "en" } }}
          role="tab"
          aria-selected={lang === "en"}
          replace
          className={
            lang === "en"
              ? "rounded-full border border-foreground bg-foreground px-3 py-1 text-xs text-background"
              : "rounded-full border border-border px-3 py-1 text-xs text-foreground-muted hover:border-accent hover:text-accent transition-colors"
          }
        >
          {labels.english}
        </Link>
        <Link
          href={{ pathname: "/cv", query: { lang: "da" } }}
          role="tab"
          aria-selected={lang === "da"}
          replace
          className={
            lang === "da"
              ? "rounded-full border border-foreground bg-foreground px-3 py-1 text-xs text-background"
              : "rounded-full border border-border px-3 py-1 text-xs text-foreground-muted hover:border-accent hover:text-accent transition-colors"
          }
        >
          {labels.danish}
        </Link>
      </div>

      {/* Canvas wrapper: no text-selection, no native context menu. */}
      <div
        className="w-full max-w-3xl select-none rounded-md border border-border bg-surface p-4 [-webkit-user-select:none] [user-select:none]"
        onContextMenu={onContextMenu}
        // Defensive: also block direct paste-attempts that some browsers
        // route via `copy`/`cut` events on the focused element.
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
      >
        {status === "loading" && (
          <p className="py-12 text-center text-foreground-subtle">
            {labels.loading}
          </p>
        )}
        {status === "error" && (
          <p className="py-12 text-center text-foreground-subtle">
            {labels.loadError}
          </p>
        )}
        <canvas
          ref={canvasRef}
          aria-label={
            status === "ready"
              ? formatPageOf(labels.pageOfTemplate, pageIndex, numPages)
              : labels.loading
          }
          className={
            status === "ready"
              ? "mx-auto block max-w-full rounded-sm"
              : "hidden"
          }
        />
      </div>

      {/* Page navigation. Disabled buttons keep the layout stable while
          the doc is still loading. */}
      <nav
        className="flex items-center gap-4"
        aria-label="CV page navigation"
      >
        <button
          type="button"
          onClick={() =>
            setPageIndex((p) => Math.max(p - 1, 1))
          }
          disabled={status !== "ready" || pageIndex <= 1}
          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs disabled:opacity-40 hover:border-accent hover:text-accent transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {labels.prev}
        </button>
        <span
          className="font-mono text-xs text-foreground-subtle"
          aria-live="polite"
        >
          {status === "ready"
            ? formatPageOf(labels.pageOfTemplate, pageIndex, numPages)
            : "—"}
        </span>
        <button
          type="button"
          onClick={() =>
            setPageIndex((p) => Math.min(p + 1, numPages || p))
          }
          disabled={status !== "ready" || pageIndex >= numPages}
          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs disabled:opacity-40 hover:border-accent hover:text-accent transition-colors"
        >
          {labels.next}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </nav>

      {/* Read-only footnote + secondary download link.
          Honest about what this is: a UX nudge, not DRM. */}
      <p className="max-w-prose text-center text-xs text-foreground-subtle">
        {labels.readonlyNote}
      </p>
      <a
        href={pdfUrl}
        className="inline-flex items-center gap-1 text-xs text-foreground-subtle hover:text-accent"
        download
      >
        <Download className="h-3 w-3" />
        {labels.directDownload}
      </a>
    </div>
  );
}
