import { getTranslations, setRequestLocale } from "next-intl/server";
import { CvViewer } from "@/components/cv-viewer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cv" });
  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  };
}

type Lang = "en" | "da";

function pickLang(raw: string | undefined): Lang {
  return raw === "da" ? "da" : "en";
}

const PDF_URL_BY_LANG: Record<Lang, string> = {
  en: "/cv/Eduard_Fischer-Szava_CV_EN.pdf",
  da: "/cv/Eduard_Fischer-Szava_CV_DA.pdf",
};

export default async function CvPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ lang?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = (await searchParams) ?? {};
  const lang = pickLang(sp.lang);
  const t = await getTranslations({ locale, namespace: "cv" });

  return (
    <section className="container-page pt-20 md:pt-24 pb-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-6">
        {t("kicker")}
      </p>
      <h1 className="max-w-3xl">{t("heading")}</h1>
      <p className="mt-6 max-w-2xl text-lg">{t("description")}</p>

      <CvViewer
        pdfUrl={PDF_URL_BY_LANG[lang]}
        lang={lang}
        labels={{
          english: t("english"),
          danish: t("danish"),
          loading: t("loading"),
          loadError: t("loadError"),
          prev: t("prev"),
          next: t("next"),
          pageOf: ({ current, total }) =>
            t("pageOf", { current, total }),
          readonlyNote: t("readonlyNote"),
          directDownload: t("directDownload"),
        }}
      />
    </section>
  );
}
