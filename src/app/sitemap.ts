import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  // Public, indexable pages only
  const routes: Array<{ path: string; priority: number; changefreq: any }> = [
    { path: "/", priority: 1.0, changefreq: "daily" },
    { path: "/how-it-works", priority: 0.8, changefreq: "weekly" },
    { path: "/eligibility", priority: 0.8, changefreq: "weekly" },
    { path: "/eligibility-check", priority: 0.9, changefreq: "weekly" },
    { path: "/service-tiers", priority: 0.9, changefreq: "weekly" },
    { path: "/resources", priority: 0.6, changefreq: "weekly" },
    { path: "/downwinders", priority: 0.9, changefreq: "weekly" },
  ];

  return routes.map((r) => ({
    url: `${siteUrl}${r.path}`,
    lastModified: now,
    changeFrequency: r.changefreq,
    priority: r.priority,
  }));
}
