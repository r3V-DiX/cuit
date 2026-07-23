import type { Metadata } from "next";
import { headers } from "next/headers";
import { Share_Tech_Mono, IBM_Plex_Serif } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/ui/Providers";

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
  title: "Cykruit — Cybersecurity Jobs Platform",
  description:
    "The job platform built for cybersecurity professionals. Find your next security role or hire top infosec talent.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? "";

  return (
    <html
      lang="en"
      className={`${ibmPlexSerif.variable} ${shareTechMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <head>
        {nonce && <meta name="csp-nonce" content={nonce} />}
      </head>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-sans), Georgia, serif" }}>
        <Providers nonce={nonce}>{children}</Providers>
      </body>
    </html>
  );
}

