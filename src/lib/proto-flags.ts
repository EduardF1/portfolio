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
 */

const isOn = (value: string | undefined): boolean => value === "1";

export const protoFlags = {
  videoBackgroundFullBleed: isOn(process.env.NEXT_PUBLIC_PROTO_VIDEO_BG_FULL_BLEED),
  sideSectionVideos: isOn(process.env.NEXT_PUBLIC_PROTO_SIDE_SECTION_VIDEOS),
  animatedDividers: isOn(process.env.NEXT_PUBLIC_PROTO_ANIMATED_DIVIDERS),
  scrollDrivenBackgrounds: isOn(process.env.NEXT_PUBLIC_PROTO_SCROLL_BG),
  stickyParallaxCards: isOn(process.env.NEXT_PUBLIC_PROTO_PARALLAX_CARDS),
} as const;

export type ProtoFlag = keyof typeof protoFlags;

/** Convenience guard for component-level toggles. */
export function isProtoEnabled(name: ProtoFlag): boolean {
  return protoFlags[name];
}
