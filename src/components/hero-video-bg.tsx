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
  label,
}: {
  className?: string;
  hidden?: boolean;
  label?: string;
}) {
  if (!MP4 && !WEBM) {
    // Conspicuous prototype placeholder so the layout shape is obvious
    // even before a real clip is wired up. Uses the accent token so it's
    // clearly visible against the page bg in every palette × theme.
    return (
      <div
        aria-hidden="true"
        className={[
          className ?? "",
          "relative isolate flex items-center justify-center overflow-hidden",
          "bg-[linear-gradient(135deg,var(--color-accent)_0%,var(--color-accent-soft)_50%,var(--color-surface-strong)_100%)]",
          "ring-1 ring-inset ring-accent/40",
          hidden ? "hidden" : "",
        ].join(" ")}
      >
        {label && (
          <span className="font-mono text-[0.55rem] uppercase tracking-[0.25em] text-background mix-blend-difference">
            {label}
          </span>
        )}
      </div>
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
 * Gated to ≥lg viewport so it shows on desktop but stays out of mobile.
 */
export function HeroFlanks() {
  return (
    <>
      {/* Left column */}
      <div
        aria-hidden="true"
        className="hidden lg:block absolute inset-y-0 left-0 w-[12%] overflow-hidden border-r border-border/60 z-0"
      >
        <VideoOrPlaceholder
          label="Variant A · Left"
          className="absolute inset-0 motion-reduce:hidden"
        />
        {/* Inner vignette: fades video into page bg */}
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
        className="hidden lg:block absolute inset-y-0 right-0 w-[12%] overflow-hidden border-l border-border/60 z-0"
      >
        <VideoOrPlaceholder
          label="Variant A · Right"
          className="absolute inset-0 motion-reduce:hidden"
        />
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
 * Variant B: full-bleed video behind the hero text with a darken overlay.
 * Gated to ≥lg viewport so it shows on desktop but stays out of mobile.
 */
export function HeroBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="hidden lg:block absolute inset-0 z-0 overflow-hidden"
    >
      <VideoOrPlaceholder
        label="Variant B · Full bleed"
        className="absolute inset-0 motion-reduce:hidden"
      />
      {/* Darken / lighten overlay (palette-aware via background token) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-background/55 backdrop-saturate-75"
      />
    </div>
  );
}

export function HeroVideoBackground({ variant }: { variant: HeroVideoVariant }) {
  if (variant === "A") return <HeroFlanks />;
  if (variant === "B") return <HeroBackdrop />;
  return null;
}
