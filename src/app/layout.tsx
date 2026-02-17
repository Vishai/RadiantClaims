import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { getSiteUrl } from "@/lib/seo/site-url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "RadiantClaims",
    template: "%s | RadiantClaims",
  },
  description:
    "Fast, guided RECA claim preparation for Downwinders — eligibility check, document organization, and step-by-step online filing through the DOJ portal.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "RadiantClaims",
    title: "RadiantClaims",
    description:
      "Fast, guided RECA claim preparation for Downwinders — eligibility check, document organization, and step-by-step online filing through the DOJ portal.",
    images: [
      {
        url: "https://www.radiantclaims.com/og-image.png",
        width: 1200,
        height: 630,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RadiantClaims",
    description:
      "Fast, guided RECA claim preparation for Downwinders — eligibility check, document organization, and step-by-step online filing through the DOJ portal.",
    images: ["https://www.radiantclaims.com/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
