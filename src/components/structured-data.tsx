import { routing } from "@/i18n/routing";

const SITE = "https://eduardfischer.dev";
const PERSON_ID = `${SITE}/#person`;
const WEBSITE_ID = `${SITE}/#website`;

function localizedUrl(locale: string, path: string): string {
  if (locale === routing.defaultLocale) return `${SITE}${path}`;
  return `${SITE}/${locale}${path}`;
}

function absoluteImage(image: string | undefined): string {
  if (!image) return `${SITE}/opengraph-image`;
  if (image.startsWith("http")) return image;
  return `${SITE}${image.startsWith("/") ? "" : "/"}${image}`;
}

type ArticleProps = {
  title: string;
  description?: string;
  date: string;
  path: string;
  locale: string;
  image?: string;
  type?: "Article" | "BlogPosting" | "Review";
};

export function ArticleJsonLd({
  title,
  description,
  date,
  path,
  locale,
  image,
  type = "Article",
}: ArticleProps) {
  const url = localizedUrl(locale, path);
  const json = {
    "@context": "https://schema.org",
    "@type": type,
    headline: title,
    ...(description ? { description } : {}),
    datePublished: new Date(date).toISOString(),
    inLanguage: locale,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: absoluteImage(image),
    author: { "@id": PERSON_ID },
    publisher: { "@id": WEBSITE_ID },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

type ImageGalleryProps = {
  title: string;
  description?: string;
  date?: string;
  path: string;
  locale: string;
  images: string[];
};

export function ImageGalleryJsonLd({
  title,
  description,
  date,
  path,
  locale,
  images,
}: ImageGalleryProps) {
  const url = localizedUrl(locale, path);
  const json = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: title,
    ...(description ? { description } : {}),
    ...(date ? { datePublished: new Date(date).toISOString() } : {}),
    inLanguage: locale,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@id": PERSON_ID },
    publisher: { "@id": WEBSITE_ID },
    image: images.map(absoluteImage),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
