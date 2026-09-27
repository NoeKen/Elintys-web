import type { Metadata } from "next";
import { DM_Serif_Display, Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/shared/guards/Providers";
import { Analytics } from "@vercel/analytics/next";
import {
  ELINTYS_ENV,
  isAnalyticsEnabled,
  shouldBlockIndexing,
} from "@/shared/config/environment";
import { EnvironmentBadge } from "@/shared/layout/EnvironmentBadge";

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: ["400"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Elintys — Plateforme événementielle",
  description: "Gérez vos événements, prestataires, invités et billetterie en un seul endroit.",
  // dev.elintys.com et uat.elintys.com ne doivent jamais apparaître dans les
  // moteurs de recherche.
  ...(shouldBlockIndexing(ELINTYS_ENV) ? { robots: { index: false, follow: false } } : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr-CA"
      className={`${dmSerifDisplay.variable} ${plusJakartaSans.variable} ${inter.variable}`}
    >
      <body className="antialiased">
        <Providers>{children}</Providers>
        {/* Analytics limité à la production : dev, UAT, CI et local ne
            faussent pas les mesures (et n'appellent pas /_vercel/insights). */}
        {isAnalyticsEnabled(ELINTYS_ENV) ? <Analytics /> : null}
        <EnvironmentBadge environment={ELINTYS_ENV} />
      </body>
    </html>
  );
}
