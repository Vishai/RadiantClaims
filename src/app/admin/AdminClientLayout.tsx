"use client";

import type { Route } from "next";
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
  BarChart3,
  Menu,
  X,
  ExternalLink,
  FileInput,
} from "lucide-react";

export default function AdminClientLayout({
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

  type NavItem = {
    name: string;
    href: Route;
    icon: React.ComponentType<{ className?: string }>;
  };

  const navigation: NavItem[] = [
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
      name: "Document Pipeline",
      href: "/admin/pipeline",
      icon: BarChart3,
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
              className="text-sage-300 hover:text-white lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sage-800 text-white"
                      : "text-sage-200 hover:bg-sage-800 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-sage-800 p-4">
            <Link
              href="/portal"
              className="flex items-center gap-2 text-sm text-sage-200 hover:text-white"
            >
              <ExternalLink className="h-4 w-4" />
              Back to Portal
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b bg-white p-4 lg:hidden">
          <button
            className="text-gray-600"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <h2 className="font-semibold">Admin</h2>
          <div className="w-6" />
        </div>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
