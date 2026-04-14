"use client";

import Link from "next/link";
import type { Route } from "next";
import { trackCtaClick } from "@/lib/analytics/meta-pixel";

interface TrackedLinkProps {
  href: string;
  ctaName: string;
  location: string;
  className?: string;
  children: React.ReactNode;
  target?: string;
  rel?: string;
}

/**
 * Next.js Link wrapper that fires a Meta Pixel CtaClick event before
 * navigation. Use this for any CTA where you want per-click analytics
 * without making the parent page a Client Component.
 *
 * Example:
 *   <TrackedLink
 *     href="/service-tiers"
 *     ctaName="see-full-comparison"
 *     location="homepage-two-ways"
 *     className="text-sm underline"
 *   >
 *     See the full comparison →
 *   </TrackedLink>
 */
export function TrackedLink({
  href,
  ctaName,
  location,
  className,
  children,
  target,
  rel,
}: TrackedLinkProps) {
  const handleClick = () => {
    try {
      trackCtaClick(ctaName, location);
    } catch {
      // Never block navigation on analytics failures
    }
  };

  return (
    <Link
      href={href as Route}
      className={className}
      target={target}
      rel={rel}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
