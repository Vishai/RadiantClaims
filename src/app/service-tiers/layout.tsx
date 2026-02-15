import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Choose the RadiantClaims plan that fits your needs—DIY claim prep or legal representation support.",
  alternates: { canonical: "/service-tiers" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
