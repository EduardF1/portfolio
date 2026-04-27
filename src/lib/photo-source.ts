/**
 * Photo provenance + attribution helpers.
 *
 * Eduard's own photos either omit the `source` block or set
 * `{ type: "personal" }`. Stock photos (e.g. Pexels, Unsplash)
 * carry the photographer + provider metadata required by the
 * licence terms.
 */

export type PhotoSourceType = "personal" | "stock";

export type PhotoSource = {
  type: PhotoSourceType;
  /** Display name of the provider, e.g. "Pexels", "Unsplash". */
  provider?: string;
  /** Canonical URL on the provider site (the photo page). */
  url?: string;
  /** Photographer / author display name. */
  photographer?: string;
  /** Photographer profile URL on the provider site. */
  photographerUrl?: string;
  /** Licence label, e.g. "Pexels License". */
  license?: string;
  /** Licence text URL. */
  licenseUrl?: string;
};

/**
 * Shape consumed by the lightbox attribution caption. The component
 * never sees raw `PhotoSource` objects — `getAttribution` is the
 * single discriminator: it returns `null` for personal photos (so
 * the caption is hidden entirely) and a flat object for stock.
 */
export type AttributionView = {
  photographer: string;
  photographerUrl?: string;
  provider: string;
  /** Provider-side URL for the specific photo (not the provider home). */
  providerUrl?: string;
  licenseUrl?: string;
};

/**
 * Resolve an attribution view from a photo's `source` block.
 *
 * Returns `null` when:
 * - `source` is missing entirely (Eduard's photos predating the field),
 * - `source.type` is not `"stock"`,
 * - the required `photographer` / `provider` fields are absent.
 *
 * Personal photos render with no attribution caption.
 */
export function getAttribution(
  source: PhotoSource | undefined,
): AttributionView | null {
  if (!source || source.type !== "stock") return null;
  if (!source.photographer || !source.provider) return null;
  return {
    photographer: source.photographer,
    photographerUrl: source.photographerUrl,
    provider: source.provider,
    providerUrl: source.url,
    licenseUrl: source.licenseUrl,
  };
}
