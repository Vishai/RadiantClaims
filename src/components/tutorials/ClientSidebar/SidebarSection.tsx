"use client";

import type { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface SidebarSectionProps {
  title: string;
  icon: LucideIcon;
  badge?: number;
  collapsed?: boolean;
  children: ReactNode;
}

export function SidebarSection({
  title,
  icon: Icon,
  badge,
  collapsed,
  children,
}: SidebarSectionProps) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1 py-4 text-muted-foreground">
        <Icon className="h-5 w-5" aria-hidden />
        <span className="text-[10px] uppercase tracking-wide">{title}</span>
        {typeof badge === "number" && badge > 0 && (
          <span className="rounded-full bg-primary/10 px-2 text-[10px] font-semibold text-primary">
            {badge}
          </span>
        )}
      </div>
    );
  }

  return (
    <section className="border-b border-border/40 px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span>{title}</span>
        </div>
        {typeof badge === "number" && badge > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-3 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}
