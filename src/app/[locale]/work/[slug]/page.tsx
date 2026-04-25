import { setRequestLocale } from "next-intl/server";
import { PagePlaceholder } from "@/components/page-placeholder";

export default async function WorkCaseStudy({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  return (
    <PagePlaceholder
      kicker={`Case study · ${slug}`}
      title="Case study coming soon."
      description="A detailed write-up of the project — context, my role, the architecture, the tricky decisions, and what shipped."
    />
  );
}
