import type { Metadata, Viewport } from "next";
import { Geist_Mono, Goldman, Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import { SiteChrome } from "@/components/site-chrome";

function getMetadataBase(): URL {
  const fromAuth = process.env.AUTH_URL?.trim();
  if (fromAuth) {
    try {
      return new URL(fromAuth);
    } catch {
      /* continue */
    }
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }
  return new URL("http://localhost:3000");
}

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const goldman = Goldman({
  variable: "--font-goldman",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: { default: "AlphaHub", template: "%s · AlphaHub" },
  description:
    "The Degen calls marketplace built on Robinhood Chain. List public and VIP alpha, accept smart contract payments, and grow your audience.",
  verification: {
    google: "gM6mauGKVNhaoELbp_PNCmET8Vsr_ciR02VxBY0W1gE",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c0c0c",
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const cookies = headersList.get("cookie");

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${goldman.variable} ${geistMono.variable} h-full`}
    >
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
      <body className="min-h-full text-sm text-stone-100 antialiased">
        <AppProviders cookies={cookies}>
          <SiteChrome>{children}</SiteChrome>
        </AppProviders>
      </body>
    </html>
  );
}
