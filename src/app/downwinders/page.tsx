import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Downwinder Claim Help (RECA)",
  description:
    "Learn who qualifies as a RECA Downwinder and what documents you need to file a complete claim packet. Step-by-step help for families impacted by nuclear testing.",
  alternates: { canonical: "/downwinders" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a RECA Downwinder?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A RECA Downwinder is someone who lived in a designated area during the nuclear testing period and later developed a compensable disease. Survivors may be able to file on behalf of a deceased family member depending on their relationship.",
      },
    },
    {
      "@type": "Question",
      name: "What documents do Downwinders typically need?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most Downwinder claims require identity/vital records (e.g., birth certificate, and death certificate for survivor claims), proof of residence/presence in an eligible area during the covered years, and medical documentation showing a compensable disease diagnosis.",
      },
    },
    {
      "@type": "Question",
      name: "Does all of Utah qualify for Downwinder claims?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "RECA eligibility can change with legislation and guidance. RadiantClaims helps you check eligibility based on the latest requirements and your specific location/time period.",
      },
    },
  ],
} as const;

export default function DownwindersPage() {
  return (
    <div className="min-h-screen bg-cream-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <nav className="border-b border-cream-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between p-6">
          <Link href="/" className="font-semibold text-sage-900">
            RadiantClaims
          </Link>
          <Link href="/eligibility-check">
            <Button className="rounded-full bg-terracotta-500 hover:bg-terracotta-600">
              Check Eligibility
            </Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto max-w-4xl space-y-10 p-6">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold text-sage-900">
            Downwinder Claim Help (RECA)
          </h1>
          <p className="text-lg text-sage-700">
            If you (or a family member) lived in an affected area during nuclear
            testing and later developed a covered disease, you may qualify for
            compensation through RECA. The hardest part is usually not the idea
            of the claim—it’s the paperwork and documents.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/eligibility-check">
              <Button className="rounded-full bg-terracotta-500 hover:bg-terracotta-600">
                2-minute eligibility check
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button variant="outline" className="rounded-full">
                How it works
              </Button>
            </Link>
          </div>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-sage-900">
            What Downwinders typically need to prove
          </h2>
          <ul className="list-disc space-y-2 pl-6 text-sage-700">
            <li>
              <strong>Residence/presence</strong> in an eligible location during
              the covered period
            </li>
            <li>
              <strong>Medical diagnosis</strong> documentation for a compensable
              disease
            </li>
            <li>
              <strong>Identity & relationship</strong> documents (especially for
              survivor claims)
            </li>
          </ul>
          <p className="text-sage-700">
            RadiantClaims helps you figure out exactly what applies to your
            situation and what to request next.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-sage-900">
            Common documents for Downwinder claims
          </h2>
          <ul className="list-disc space-y-2 pl-6 text-sage-700">
            <li>
              Birth certificate (and death certificate for survivor claims)
            </li>
            <li>
              Proof of residence/presence (school records, employment records,
              tax records, utility bills, etc.)
            </li>
            <li>
              Medical records (pathology report, treating facility records,
              cancer registry info)
            </li>
          </ul>
          <div>
            <Link href="/resources" className="text-terracotta-700 underline">
              Find document resources
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-cream-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-sage-900">Next step</h2>
          <p className="mt-2 text-sage-700">
            Start with an eligibility check. If you’re likely eligible, we’ll
            guide you through the form and document checklist.
          </p>
          <div className="mt-4">
            <Link href="/eligibility-check">
              <Button className="rounded-full bg-terracotta-500 hover:bg-terracotta-600">
                Check eligibility
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
