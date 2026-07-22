import type { Metadata } from "next";

import { Share_Tech_Mono, IBM_Plex_Serif } from "next/font/google";
import "./globals.css";
import { Providers } from '@/components/ui';

const ibmPlexSerif = IBM_Plex_Serif({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const shareTechMono = Share_Tech_Mono({
  variable: "--font-terminal",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cykruit Admin — Console",
  description: "Internal admin console for the Cykruit platform.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ibmPlexSerif.variable} ${shareTechMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-sans), Georgia, serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
