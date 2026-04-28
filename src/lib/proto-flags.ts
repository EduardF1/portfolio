/**
 * Read-only feature flags for the prototype environment.
 *
 * All flags are `NEXT_PUBLIC_PROTO_*` so they are inlined into the client
 * bundle at build time. Default to `false` in prod (env vars unset).
 *
 * Important Next.js gotcha: only **static** `process.env.NEXT_PUBLIC_*`
 * references are inlined at build time — dynamic lookups like
 * `process.env[someVar]` are NOT replaced and resolve to `undefined` in
 * the browser. Each flag below therefore reads its env var by literal
 * name. See node_modules/next/dist/docs/01-app/02-guides/environment-variables.md.
 *
 * Two access styles are exposed:
 *   - `protoFlags.<name>` / `isProtoEnabled("<name>")` — typed object form,
 *     handy for table-driven code and tests.
 *   - `<name>Enabled()` — bare functions, used at component/page mount sites.
 *
 * Both compile to the same constant after Next inlines the env reads, so
 * they are interchangeable. Add new flags to BOTH surfaces.
 */

const isOn = (value: string | undefined): boolean => value === "1";

export const protoFlags = {
  get videoBackgroundFullBleed(): boolean {
    return isOn(process.env.NEXT_PUBLIC_PROTO_VIDEO_BG_FULL_BLEED);
  },
  get sideSectionVideos(): boolean {
    return isOn(process.env.NEXT_PUBLIC_PROTO_SIDE_SECTION_VIDEOS);
  },
  get animatedDividers(): boolean {
    return isOn(process.env.NEXT_PUBLIC_PROTO_ANIMATED_DIVIDERS);
  },
  get scrollDrivenBackgrounds(): boolean {
    return isOn(process.env.NEXT_PUBLIC_PROTO_SCROLL_BG);
  },
  get stickyParallaxCards(): boolean {
    return isOn(process.env.NEXT_PUBLIC_PROTO_PARALLAX_CARDS);
  },
};

export type ProtoFlag = keyof typeof protoFlags;

/** Convenience guard for component-level toggles. */
export function isProtoEnabled(name: ProtoFlag): boolean {
  return protoFlags[name];
}

/**
 * Animated section dividers between major page sections on `/`.
 * `NEXT_PUBLIC_PROTO_ANIMATED_DIVIDERS=1`
 */
export function animatedDividersEnabled(): boolean {
  return protoFlags.animatedDividers;
}

/**
 * CSS scroll-driven background animation on hero/about.
 * Chromium-only; Safari/Firefox fall back to static via `@supports`.
 * `NEXT_PUBLIC_PROTO_SCROLL_BG=1`
 */
export function scrollBackgroundEnabled(): boolean {
  return protoFlags.scrollDrivenBackgrounds;
}

/**
 * Sticky parallax cards on `/writing` and `/recommends`.
 * Uses CSS `position: sticky`; honours `prefers-reduced-motion`.
 * `NEXT_PUBLIC_PROTO_PARALLAX_CARDS=1`
 */
export function parallaxCardsEnabled(): boolean {
  return protoFlags.stickyParallaxCards;
}
