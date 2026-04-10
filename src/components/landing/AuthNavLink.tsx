"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

/**
 * Auth-aware navigation link for the landing page.
 * Shows "My Dashboard" for logged-in users, "Login" for guests.
 */
export function AuthNavLink() {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <span className="min-h-[44px] px-4 text-sm font-semibold text-gray-400">
        ...
      </span>
    );
  }

  if (status === "authenticated") {
    return (
      <Link href="/portal">
        <button className="min-h-[44px] rounded-full bg-[#D65F4D] px-5 py-2 text-sm font-semibold text-white hover:bg-[#c4523f]">
          My Dashboard
        </button>
      </Link>
    );
  }

  return (
    <Link href="/login">
      <button className="min-h-[44px] px-4 text-sm font-semibold text-gray-600 hover:text-gray-900">
        Login
      </button>
    </Link>
  );
}
