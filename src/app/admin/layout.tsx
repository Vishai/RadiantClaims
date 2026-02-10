"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Tag,
  UserPlus,
  Settings,
  CheckCircle2,
  Menu,
  X,
  ExternalLink,
  FileInput,
} from "lucide-react";

export default function AdminLayout({
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
      router.push("/login?callbackUrl=/admin");
      return;
    }

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      router.push("/portal");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      name: "User Management",
      href: "/admin/users",
      icon: Users,
    },
    {
      name: "Claims & Intake",
      href: "/admin/claims",
      icon: FileText,
    },
    {
      name: "AI Review Queue",
      href: "/admin/ai-review",
      icon: CheckCircle2,
    },
    {
      name: "PDF Field Mapping",
      href: "/admin/pdf-mapping",
      icon: FileInput,
    },
    {
      name: "Promo Codes",
      href: "/admin/promo-codes",
      icon: Tag,
    },
    {
      name: "Waitlist",
      href: "/admin/waitlist",
      icon: UserPlus,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-sage-900 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-sage-800 p-6">
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-sage-300 hover:text-white lg:hidden"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href as any}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sage-800 text-white"
                      : "text-sage-300 hover:bg-sage-800 hover:text-white"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-sage-800 p-4">
            {/* Quick Access Links */}
            <div className="mb-4 space-y-2">
              <p className="text-xs font-medium text-sage-400">Quick Access</p>
              <Link
                href={"/portal" as any}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-sage-300 hover:bg-sage-800 hover:text-white"
                onClick={() => setSidebarOpen(false)}
              >
                <ExternalLink className="h-3 w-3" />
                View as Customer
              </Link>
              <Link
                href={"/reca/form" as any}
                target="_blank"
                className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-sage-300 hover:bg-sage-800 hover:text-white"
              >
                <ExternalLink className="h-3 w-3" />
                RECA Form
              </Link>
            </div>

            <div className="rounded-lg bg-sage-800 p-3">
              <p className="text-xs font-medium text-sage-300">Logged in as</p>
              <p className="text-sm font-semibold text-white">
                {session.user.name || session.user.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="border-b border-gray-200 bg-white px-4 py-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
