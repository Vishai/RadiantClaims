import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/react";
import { getSiteUrl } from "@/lib/seo/site-url";
import { Footer } from "@/components/layout/Footer";

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
      <head>
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-GSTWR0MEK6"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-GSTWR0MEK6');`,
          }}
        />
        {/* Meta Pixel */}
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
fbq('track', 'PageView');`,
            }}
          />
        )}
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "RadiantClaims",
              url: "https://www.radiantclaims.com",
              description:
                "Guided RECA claim preparation — from eligibility to submission",
              sameAs: ["https://x.com/BramboArmstrong"],
            }),
          }}
        />
        <Providers>
          {children}
          <Footer />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
