import type { Metadata } from "next";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password | RadiantClaims",
};

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: { token?: string | string[] };
}) {
  const tokenParam = searchParams?.token;
  const token = Array.isArray(tokenParam)
    ? (tokenParam[0] ?? null)
    : (tokenParam ?? null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cream-50 via-peach-50 to-cream-100">
      <ResetPasswordForm token={token} />
    </div>
  );
}
