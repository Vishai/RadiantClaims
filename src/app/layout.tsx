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
    "Fast, guided RECA claim preparation for Downwinders—eligibility check, document checklist, and step-by-step packet building.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "RadiantClaims",
    title: "RadiantClaims",
    description:
      "Fast, guided RECA claim preparation for Downwinders—eligibility check, document checklist, and step-by-step packet building.",
  },
  twitter: {
    card: "summary_large_image",
    title: "RadiantClaims",
    description:
      "Fast, guided RECA claim preparation for Downwinders—eligibility check, document checklist, and step-by-step packet building.",
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
