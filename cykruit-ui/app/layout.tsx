import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://cykruit.com"),
  title: {
    default: "Cykruit — Cybersecurity Jobs Platform",
    template: "%s | Cykruit",
  },
  description:
    "The job platform built for cybersecurity professionals. Find your next security role or hire top infosec talent.",
  openGraph: {
    type: "website",
    siteName: "Cykruit",
    title: "Cykruit — Cybersecurity Jobs Platform",
    description:
      "The job platform built for cybersecurity professionals. Find your next security role or hire top infosec talent.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cykruit — Cybersecurity Jobs Platform",
    description:
      "The job platform built for cybersecurity professionals. Find your next security role or hire top infosec talent.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? "";
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html
      lang="en"
      className={`${ibmPlexSerif.variable} ${shareTechMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <head>
        {nonce && <meta name="csp-nonce" content={nonce} />}
      </head>
      <body className="min-h-full flex flex-col">
        <Providers nonce={nonce}>{children}</Providers>
        {gaId && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              nonce={nonce}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              nonce={nonce}
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}

