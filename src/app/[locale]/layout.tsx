import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SearchPalette } from "@/components/search-palette";
import { ThemeProvider } from "@/components/theme-provider";
import { PaletteProvider } from "@/components/palette-provider";
import { PaletteTracker } from "@/components/palette-tracker";
import { VisitTracker } from "@/components/visit-tracker";
import { routing } from "@/i18n/routing";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://eduardfischer.dev"),
  title: {
    default: "Eduard Fischer-Szava, Software Engineer & IT Consultant",
    template: "%s · Eduard Fischer-Szava",
  },
  description:
    "Software Engineer & IT Consultant in Aarhus, Denmark. Building stable, business-critical systems, currently at Mjølner Informatics.",
  authors: [{ name: "Eduard Fischer-Szava" }],
  openGraph: {
    type: "website",
    siteName: "Eduard Fischer-Szava",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Eduard Fischer-Szava — Software Engineer & IT Consultant",
        type: "image/png",
      },
    ],
  },
  // hreflang tells Google.dk which language to surface where. The
  // x-default points at the EN canonical so non-DA visitors land on
  // English by default.
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      "en-DK": "/",
      da: "/da",
      "da-DK": "/da",
      "x-default": "/",
    },
  },
  robots: { index: true, follow: true },
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION
      ? { google: process.env.GOOGLE_SITE_VERIFICATION }
      : {}),
    ...(process.env.BING_SITE_VERIFICATION
      ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } }
      : {}),
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        {/* Warm the connection to the Devicon CDN (Skills tile logos) and
            the GitHub avatar host (CircleCI / a few publisher logos). Both
            are referenced from Skills tiles and reading-feed previews; the
            preconnect saves ~50–100 ms on the first tile fetch. */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://github.com" crossOrigin="anonymous" />

        {/* Browser chrome / mobile address-bar tint. Single token — the
            three palettes share the warm-cream background so a single
            theme-color is honest. */}
        <meta name="theme-color" content="#FAF9F5" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#15110D" media="(prefers-color-scheme: dark)" />

        {/* Person + Website JSON-LD — feeds search-engine knowledge panels.
            Restraint: only fields with public, verifiable values. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Person",
                  "@id": "https://eduardfischer.dev/#person",
                  name: "Eduard Fischer-Szava",
                  alternateName: ["Eduard Fischer", "Eduard Fischer Szava"],
                  jobTitle: "Software Engineer / IT Consultant",
                  url: "https://eduardfischer.dev",
                  image: "https://eduardfischer.dev/images/hero/portrait.png",
                  worksFor: {
                    "@type": "Organization",
                    name: "Mjølner Informatics",
                    url: "https://mjolner.dk/en/",
                  },
                  alumniOf: [
                    {
                      "@type": "CollegeOrUniversity",
                      name: "Aarhus University",
                      url: "https://international.au.dk/",
                    },
                    {
                      "@type": "CollegeOrUniversity",
                      name: "VIA University College",
                      url: "https://en.via.dk/",
                    },
                    {
                      "@type": "CollegeOrUniversity",
                      name: "IBA International Business Academy",
                      url: "https://www.iba.dk/",
                    },
                  ],
                  knowsLanguage: ["en", "da", "ro"],
                  address: {
                    "@type": "PostalAddress",
                    addressLocality: "Aarhus",
                    addressCountry: "DK",
                  },
                  sameAs: [
                    "https://github.com/EduardF1",
                    "https://www.linkedin.com/in/eduard-fischer-szava/",
                  ],
                },
                {
                  "@type": "WebSite",
                  "@id": "https://eduardfischer.dev/#website",
                  url: "https://eduardfischer.dev",
                  name: "Eduard Fischer-Szava — EduardFischer.dev",
                  inLanguage: ["en", "da"],
                  publisher: { "@id": "https://eduardfischer.dev/#person" },
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate:
                        "https://eduardfischer.dev/search?q={search_term_string}",
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var p=localStorage.getItem('palette');if(p&&['schwarzgelb','mountain-navy','woodsy-cabin'].includes(p))document.documentElement.setAttribute('data-palette',p);else document.documentElement.setAttribute('data-palette','mountain-navy');}catch(_){}",
          }}
        />
        <NextIntlClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <PaletteProvider>
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
              <SearchPalette />
              <VisitTracker />
              <PaletteTracker />
            </PaletteProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
