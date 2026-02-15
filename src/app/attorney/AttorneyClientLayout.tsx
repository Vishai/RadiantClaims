"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Menu,
  X,
  ExternalLink,
  Settings,
} from "lucide-react";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: (pathname: string) => boolean;
};

export default function AttorneyClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/login?callbackUrl=/attorney/dashboard");
      return;
    }

    const allowedRoles = new Set(["ATTORNEY", "FIRM_ADMIN"]);
    if (!allowedRoles.has(session.user.role)) {
      router.push("/portal");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-sage-900">Loading...</div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const navigation: NavItem[] = [
    {
      name: "Overview",
      href: "/attorney/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Claimants",
      href: "/attorney/claimants",
      icon: Users,
      match: (path) =>
        path === "/attorney/claimants" ||
        path.startsWith("/attorney/claimants/"),
    },
    {
      name: "Waitlist Leads",
      href: "/attorney/waitlist",
      icon: UserPlus,
      match: (path) =>
        path === "/attorney/waitlist" || path.startsWith("/attorney/waitlist"),
    },
    {
      name: "Settings",
      href: "/attorney/settings",
      icon: Settings,
      match: (path) => path === "/attorney/settings",
    },
  ];

  const isActive = (item: NavItem) => {
    if (item.match) {
      return item.match(pathname);
    }
    return pathname === item.href;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-slate-900 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-white/10 p-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-300">
                RadiantClaims
              </p>
              <h1 className="text-xl font-bold text-white">Attorney Portal</h1>
            </div>
            <button
              className="text-slate-300 hover:text-white lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href as any}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive(item)
                      ? "bg-white/10 text-white"
                      : "text-slate-200 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-4">
            <Link
              href="/portal"
              className="flex items-center gap-2 text-sm text-slate-200 hover:text-white"
            >
              <ExternalLink className="h-4 w-4" />
              Back to Portal
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b bg-white p-4 lg:hidden">
          <button
            className="text-gray-600"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <h2 className="font-semibold">Attorney</h2>
          <div className="w-6" />
        </div>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
