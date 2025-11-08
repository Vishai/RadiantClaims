"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  BookOpen,
  FileText,
  Menu,
  X,
  ExternalLink,
  LogOut,
  Settings,
} from "lucide-react";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: (pathname: string) => boolean;
};

export default function AttorneyLayout({
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
              onClick={() => setSidebarOpen(false)}
              className="text-slate-300 hover:text-white lg:hidden"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.name}
                  href={item.href as any}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    active
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
            <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-200">
              <p className="mb-2 font-semibold text-white">Helpful Resources</p>
              <ul className="space-y-2">
                <li>
                  <Link
                    href={"/resources" as any}
                    className="flex items-center gap-2 hover:text-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <BookOpen className="h-4 w-4" />
                    Resource Finder
                  </Link>
                </li>
                <li>
                  <Link
                    href={"/portal/documents" as any}
                    className="flex items-center gap-2 hover:text-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <FileText className="h-4 w-4" />
                    Document Center
                  </Link>
                </li>
              </ul>
            </div>
          </nav>

          <div className="border-t border-white/10 p-4 text-slate-200">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Quick Access
            </p>
            <div className="mt-2 space-y-2 text-sm">
              <Link
                href={"/portal" as any}
                className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-white/10"
                onClick={() => setSidebarOpen(false)}
              >
                <ExternalLink className="h-4 w-4" />
                View Customer Portal
              </Link>
              <Link
                href={"/reca/start" as any}
                className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-white/10"
                onClick={() => setSidebarOpen(false)}
              >
                <ExternalLink className="h-4 w-4" />
                RECA Application
              </Link>
            </div>

            <div className="mt-4 rounded-lg bg-slate-800 p-3">
              <p className="text-xs text-slate-400">Signed in as</p>
              <p className="text-sm font-semibold text-white">
                {session.user.name || session.user.email}
              </p>
              <button
                onClick={() => {
                  void signOut({ callbackUrl: "/login" });
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-gray-200 bg-white px-4 py-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
