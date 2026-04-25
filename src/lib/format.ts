export function formatDate(input: string | Date, locale = "en-GB") {
  const d = typeof input === "string" ? new Date(input) : input;
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatYearMonth(input: string | Date, locale = "en-GB") {
  const d = typeof input === "string" ? new Date(input) : input;
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
  });
}
