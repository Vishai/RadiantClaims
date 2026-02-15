import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RECA Eligibility Check (2 minutes)",
  description:
    "Answer a few questions to see if you may qualify for RECA Downwinder compensation and learn what to do next.",
  alternates: { canonical: "/eligibility-check" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
