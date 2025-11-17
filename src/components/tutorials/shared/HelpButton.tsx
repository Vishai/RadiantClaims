"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HelpButtonProps {
  onClick?: () => void;
  label?: string;
}

export function HelpButton({
  onClick,
  label = "Help & tutorials",
}: HelpButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className="fixed bottom-6 right-6 z-40 shadow-lg sm:hidden"
      onClick={onClick}
    >
      <HelpCircle className="h-4 w-4" />
      <span>{label}</span>
    </Button>
  );
}
