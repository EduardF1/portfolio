import { setRequestLocale } from "next-intl/server";
import { SearchPageClient } from "./search-client";

export const metadata = { title: "Search" };

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { q } = await searchParams;
  return <SearchPageClient locale={locale} initialQuery={q ?? ""} />;
}
