/**
 * Convert a company display name (e.g. "Mjølner Informatics", "Boozt Fashion")
 * into a URL-friendly anchor slug (e.g. "mjolner-informatics", "boozt-fashion").
 *
 * Used to derive `<li id="role-{slug}">` IDs in the Experience timeline so
 * `eduardfischer.dev/#role-netcompany` jumps straight to the right card.
 */
export function roleSlug(company: string): string {
  return company
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics — Mjølner → mjolner
    .replace(/ø/g, "o") // explicit Danish ø handling (NFD doesn't always cover it)
    .replace(/æ/g, "ae")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
