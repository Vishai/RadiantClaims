import Link from "next/link";
import { Heart } from "lucide-react";

/**
 * Site-wide footer with legal links and brand disclaimer.
 * Renders on every page via app/layout.tsx.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-cream-200 bg-cream-50 px-6 py-10 text-sm text-sage-700">
      <div className="mx-auto max-w-6xl">
        {/* Top row: brand + legal links */}
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta-500">
              <Heart className="h-4 w-4 text-white" fill="white" />
            </div>
            <span className="text-lg font-bold text-sage-800">
              RadiantClaims
            </span>
          </Link>

          {/* Legal + contact links */}
          <nav
            aria-label="Footer"
            className="flex flex-wrap items-center gap-x-6 gap-y-2"
          >
            <Link
              href="/privacy"
              className="text-sage-700 hover:text-terracotta-600"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sage-700 hover:text-terracotta-600"
            >
              Terms of Service
            </Link>
            <Link
              href="/contact"
              className="text-sage-700 hover:text-terracotta-600"
            >
              Contact
            </Link>
            <Link
              href="/resources"
              className="text-sage-700 hover:text-terracotta-600"
            >
              Resources
            </Link>
          </nav>
        </div>

        {/* Divider */}
        <div className="my-8 h-px bg-cream-200" />

        {/* Disclaimer */}
        <div className="space-y-3 text-xs leading-relaxed text-sage-600">
          <p>
            <strong className="text-sage-800">
              Important — not a law firm.
            </strong>{" "}
            RadiantClaims provides document preparation services for the federal
            Radiation Exposure Compensation Act (RECA) program. We are not a law
            firm, we do not provide legal advice, and we are not a substitute
            for an attorney. For legal representation, see our Legal
            Representation path, which connects you with Heritage Law Offices.
          </p>
          <p>
            RadiantClaims is an independent service and is not affiliated with
            the U.S. Department of Justice or any other government agency. The
            DOJ&apos;s official RECA program information is available at{" "}
            <a
              href="https://www.justice.gov/civil/reca"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-terracotta-600"
            >
              justice.gov/civil/reca
            </a>
            .
          </p>
          <p>&copy; {year} RadiantClaims. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
