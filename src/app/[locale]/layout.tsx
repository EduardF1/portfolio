import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ThemeProvider } from "@/components/theme-provider";
import { PaletteProvider } from "@/components/palette-provider";
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
            </PaletteProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
