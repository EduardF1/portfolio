/**
 * Hero video background — two prototype variants per design spec 8.4.
 *
 *   A = flanking sides   (two slim vertical columns either side of the hero text)
 *   B = full-bleed       (video covers the hero, darken overlay over)
 *
 * No video files are committed to the repo until Eduard approves a
 * specific reuse-allowed clip. Until env vars are set, the component
 * renders a tonal-gradient placeholder so the layout is visible.
 *
 * Configure via env (do NOT inline candidate URLs here — that decision
 * sits with the user):
 *   NEXT_PUBLIC_HERO_VIDEO_MP4   = https://… (Pexels / Coverr / Pixabay only)
 *   NEXT_PUBLIC_HERO_VIDEO_WEBM  = https://…  (optional fallback codec)
 *   NEXT_PUBLIC_HERO_VIDEO_POSTER = /photos/… or https://… (still frame)
 *
 * Activate at runtime by appending ?video=A or ?video=B to the URL
 * (handled by the Hero component, which passes `variant` here).
 */

const MP4 = process.env.NEXT_PUBLIC_HERO_VIDEO_MP4;
const WEBM = process.env.NEXT_PUBLIC_HERO_VIDEO_WEBM;
const POSTER = process.env.NEXT_PUBLIC_HERO_VIDEO_POSTER;

export type HeroVideoVariant = "A" | "B";

function VideoOrPlaceholder({
  className,
  hidden = false,
}: {
  className?: string;
  hidden?: boolean;
}) {
  if (!MP4 && !WEBM) {
    // Tonal-gradient placeholder. Cool-tone, palette-aware via CSS vars.
    return (
      <div
        aria-hidden="true"
        className={[
          className ?? "",
          "bg-[radial-gradient(ellipse_at_top,var(--color-surface-strong)_0%,var(--color-surface)_45%,var(--color-background)_100%)]",
          hidden ? "hidden" : "",
        ].join(" ")}
      />
    );
  }
  return (
    <video
      aria-hidden="true"
      muted
      autoPlay
      playsInline
      loop
      preload="metadata"
      poster={POSTER}
      className={[className ?? "", hidden ? "hidden" : ""].join(" ")}
    >
      {WEBM && <source src={WEBM} type="video/webm" />}
      {MP4 && <source src={MP4} type="video/mp4" />}
    </video>
  );
}

/**
 * Variant A: two slim vertical columns flanking the hero text.
 * Gated to ≥@lg via container query — invisible on mobile/tablet.
 */
export function HeroFlanks() {
  return (
    <>
      {/* Left column */}
      <div
        aria-hidden="true"
        className="hidden @lg:block absolute inset-y-0 left-0 w-[12%] overflow-hidden border-r border-border/60"
      >
        <VideoOrPlaceholder className="h-full w-full object-cover motion-reduce:hidden" />
        {/* Inner vignette — fades video into page bg */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow:
              "inset -60px 0 60px -20px var(--color-background)",
          }}
        />
      </div>
      {/* Right column */}
      <div
        aria-hidden="true"
        className="hidden @lg:block absolute inset-y-0 right-0 w-[12%] overflow-hidden border-l border-border/60"
      >
        <VideoOrPlaceholder className="h-full w-full object-cover motion-reduce:hidden" />
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow:
              "inset 60px 0 60px -20px var(--color-background)",
          }}
        />
      </div>
    </>
  );
}

/**
 * Variant B: full-bleed video behind the hero text with a 60% darken overlay.
 * Gated to ≥@lg via container query — invisible on mobile/tablet.
 */
export function HeroBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="hidden @lg:block absolute inset-0 -z-0 overflow-hidden"
    >
      <VideoOrPlaceholder className="h-full w-full object-cover motion-reduce:hidden" />
      {/* Darken / lighten overlay (palette-aware via foreground / background tokens) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-background/60 backdrop-saturate-75"
      />
    </div>
  );
}

export function HeroVideoBackground({ variant }: { variant: HeroVideoVariant }) {
  if (variant === "A") return <HeroFlanks />;
  if (variant === "B") return <HeroBackdrop />;
  return null;
}
