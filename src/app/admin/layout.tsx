import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

/**
 * Root layout for the /admin tree — separate from `[locale]/layout.tsx`
 * because /admin is intentionally not localised (only Eduard sees it)
 * and we want to avoid loading the i18n provider, search palette,
 * locale toggle, etc. on a page that's gated behind a cookie.
 *
 * Multiple root layouts are supported in Next.js App Router; navigating
 * between /admin and /[locale] triggers a full page load, which is
 * fine because /admin is reached via a direct URL with the secret key.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Hard noindex — even if a search engine somehow scrapes this URL
  // (the secret-key handshake should keep it private) we want a
  // belt-and-braces signal.
  robots: { index: false, follow: false, nocache: true },
  title: "Admin",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
