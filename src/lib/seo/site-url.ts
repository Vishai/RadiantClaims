export function getSiteUrl() {
  // Prefer explicit canonical URL
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.NEXTAUTH_URL;

  if (explicit) {
    return explicit.startsWith("http") ? explicit : `https://${explicit}`;
  }

  // Vercel provides host without scheme
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  // Local/dev fallback
  return "http://localhost:3000";
}
