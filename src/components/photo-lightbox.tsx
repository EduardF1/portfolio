"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { responsiveGridColsClass } from "@/lib/grid-cols";
import { getAttribution, type PhotoSource } from "@/lib/photo-source";

export type LightboxPhoto = {
  src: string;
  alt: string;
  /** Optional caption shown under the full-size image. */
  caption?: string;
  /**
   * Optional provenance block. When present and `type === "stock"`
   * the lightbox renders a small attribution caption underneath the
   * image. Personal photos (no `source` or `type === "personal"`)
   * render unchanged.
   */
  source?: PhotoSource;
};

export type PhotoLightboxProps = {
  photos: LightboxPhoto[];
  /** Localised "Photo {current} of {total}" template, e.g. "Photo {current} of {total}". */
  countLabel?: string;
  /** Localised aria-label for the prev arrow. */
  prevLabel?: string;
  /** Localised aria-label for the next arrow. */
  nextLabel?: string;
  /** Localised aria-label for the close button. */
  closeLabel?: string;
  /**
   * When true the first thumbnail is given `priority` so it is
   * preloaded as the Largest Contentful Paint candidate. Only set
   * this for the first visible section on the page; all others
   * should leave it unset (defaults to false) to avoid generating
   * unnecessary `<link rel="preload">` hints.
   */
  priorityFirstImage?: boolean;
};

/**
 * Lightbox-aware photo grid. Click a thumbnail → modal opens with the
 * full-size image; ←/→ navigates, ESC closes, click backdrop closes.
 *
 * Hand-rolled (no extra dependency). Plays well with reduced-motion;
 * trap focus inside the dialog while open.
 */
export function PhotoLightbox({
  photos,
  countLabel = "Photo {current} of {total}",
  prevLabel = "Previous photo",
  nextLabel = "Next photo",
  closeLabel = "Close",
  priorityFirstImage = false,
}: PhotoLightboxProps) {
  const tt = useTranslations("tooltips");
  const ta = useTranslations("attribution");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const dialogId = useId();
  const labelId = `${dialogId}-label`;
  const captionId = `${dialogId}-caption`;
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  // Touch tracking for horizontal swipe.
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const open = useCallback((i: number) => setOpenIndex(i), []);
  const close = useCallback(() => setOpenIndex(null), []);

  const next = useCallback(() => {
    setOpenIndex((i) => {
      if (i === null) return i;
      return (i + 1) % photos.length;
    });
  }, [photos.length]);

  const prev = useCallback(() => {
    setOpenIndex((i) => {
      if (i === null) return i;
      return (i - 1 + photos.length) % photos.length;
    });
  }, [photos.length]);

  // Body scroll lock while open.
  useEffect(() => {
    if (openIndex === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [openIndex]);

  // Global key handlers + initial focus management while open.
  useEffect(() => {
    if (openIndex === null) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
        return;
      }
      // Tab focus trap inside the dialog.
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    // Defer initial focus until the dialog has actually rendered.
    queueMicrotask(() => closeButtonRef.current?.focus());
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openIndex, close, next, prev]);

  // When closing, return focus to the originating thumbnail.
  const lastOpenIndex = useRef<number | null>(null);
  useEffect(() => {
    if (openIndex !== null) {
      lastOpenIndex.current = openIndex;
      return;
    }
    const i = lastOpenIndex.current;
    if (i !== null) {
      const trigger = triggerRefs.current[i];
      // Schedule focus restoration after React commits the close.
      queueMicrotask(() => trigger?.focus());
    }
  }, [openIndex]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) close();
    },
    [close],
  );

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dx) < 50) return;
    if (Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0) next();
    else prev();
  };

  const currentPhoto = openIndex !== null ? photos[openIndex] : null;
  const attribution = currentPhoto
    ? getAttribution(currentPhoto.source)
    : null;
  const countText = useMemo(() => {
    if (openIndex === null) return "";
    return countLabel
      .replace("{current}", String(openIndex + 1))
      .replace("{total}", String(photos.length));
  }, [countLabel, openIndex, photos.length]);

  if (!photos || photos.length === 0) return null;

  return (
    <>
      <div className={`grid ${responsiveGridColsClass(photos.length, 3)} gap-3`}>
        {photos.map((photo, i) => (
          <button
            key={`${photo.src}-${i}`}
            ref={(el) => {
              triggerRefs.current[i] = el;
            }}
            type="button"
            onClick={() => open(i)}
            className="relative aspect-square overflow-hidden rounded-lg bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:transition-transform motion-safe:hover:scale-[1.01]"
            aria-label={photo.alt}
            data-testid="lightbox-thumb"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
              priority={i === 0 && priorityFirstImage}
              loading={i === 0 && priorityFirstImage ? undefined : "lazy"}
            />
          </button>
        ))}
      </div>

      {currentPhoto && openIndex !== null && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelId}
          aria-describedby={currentPhoto.caption ? captionId : undefined}
          onClick={handleBackdropClick}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm motion-safe:transition-opacity"
          data-testid="lightbox-dialog"
        >
          <span id={labelId} className="sr-only">
            {currentPhoto.alt}
          </span>

          <div className="absolute top-3 right-3 flex items-center gap-2">
            <span
              className="rounded-md bg-black/40 px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-white/80"
              aria-live="polite"
            >
              {countText}
            </span>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={close}
              aria-label={closeLabel}
              title={tt("lightboxClose")}
              className="rounded-md bg-black/40 px-3 py-1 text-sm text-white hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              data-testid="lightbox-close"
            >
              {closeLabel}
            </button>
          </div>

          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label={prevLabel}
              title={tt("lightboxPrev")}
              className="absolute left-2 sm:left-6 rounded-full bg-black/40 px-4 py-2 text-2xl text-white hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              data-testid="lightbox-prev"
            >
              <span aria-hidden="true">←</span>
            </button>
          )}

          <div
            // Stop the click on the image area from closing the modal,
            // while still letting clicks on the surrounding backdrop close.
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[88vh] max-w-[92vw] sm:max-w-[80vw]"
          >
            <Image
              src={currentPhoto.src}
              alt={currentPhoto.alt}
              width={1600}
              height={1200}
              className="max-h-[88vh] w-auto h-auto rounded-md object-contain"
              loading="eager"
              sizes="92vw"
            />
            {currentPhoto.caption && (
              <p
                id={captionId}
                role="note"
                aria-label="Photo attribution"
                data-testid="lightbox-caption"
                className="mt-3 text-center font-mono text-xs uppercase tracking-[0.2em] text-white/80"
              >
                {currentPhoto.caption}
              </p>
            )}
            {attribution && (
              <p
                className="mt-2 text-center font-mono text-[11px] tracking-[0.05em] text-white/60"
                data-testid="lightbox-attribution"
              >
                {attribution.photographerUrl ? (
                  <a
                    href={attribution.photographerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${ta("photoBy", { name: attribution.photographer })} (opens in a new tab)`}
                    className="underline decoration-white/30 underline-offset-2 hover:text-white hover:decoration-white"
                  >
                    {ta("photoBy", { name: attribution.photographer })}
                  </a>
                ) : (
                  <span>
                    {ta("photoBy", { name: attribution.photographer })}
                  </span>
                )}
                {" "}
                {attribution.providerUrl ? (
                  <a
                    href={attribution.providerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${ta("via", { provider: attribution.provider })} (opens in a new tab)`}
                    className="underline decoration-white/30 underline-offset-2 hover:text-white hover:decoration-white"
                  >
                    {ta("via", { provider: attribution.provider })}
                  </a>
                ) : (
                  <span>
                    {ta("via", { provider: attribution.provider })}
                  </span>
                )}
                {attribution.licenseUrl && (
                  <>
                    {" — "}
                    <a
                      href={attribution.licenseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${ta("licenseLabel")} (opens in a new tab)`}
                      className="underline decoration-white/30 underline-offset-2 hover:text-white hover:decoration-white"
                    >
                      {ta("licenseLabel")}
                    </a>
                  </>
                )}
              </p>
            )}
          </div>

          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label={nextLabel}
              title={tt("lightboxNext")}
              className="absolute right-2 sm:right-6 rounded-full bg-black/40 px-4 py-2 text-2xl text-white hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              data-testid="lightbox-next"
            >
              <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
      )}
    </>
  );
}
