"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<
    "idle" | "accepting" | "accepted" | "error"
  >("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing invite token.");
      return;
    }

    const run = async () => {
      setStatus("accepting");
      try {
        const res = await fetch("/api/portal/collaborators/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setMessage(data?.error || "Failed to accept invite.");
          return;
        }

        setStatus("accepted");
        setMessage("Invite accepted! Redirecting you to the portal...");

        setTimeout(() => {
          router.push("/portal");
        }, 1200);
      } catch (e) {
        setStatus("error");
        setMessage("Failed to accept invite. Please try again.");
      }
    };

    run();
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cream-50 via-peach-50 to-cream-100 px-6">
      <div className="w-full max-w-md rounded-3xl border-2 border-cream-200 bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-bold text-sage-900">Accept Invitation</h1>
        <p className="mt-3 text-sm text-sage-600">
          {status === "accepting" && "Accepting your invitation..."}
          {status === "accepted" && message}
          {status === "error" && message}
          {status === "idle" && "Preparing..."}
        </p>

        {status === "error" && (
          <div className="mt-6 space-y-3">
            <a
              href="/login"
              className="block rounded-full bg-terracotta-500 px-5 py-3 text-sm font-semibold text-white hover:bg-terracotta-600"
            >
              Sign in and try again
            </a>
            <a
              href="/portal"
              className="block text-sm text-sage-600 hover:text-terracotta-600"
            >
              Go to portal
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
