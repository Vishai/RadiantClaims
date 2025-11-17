"use client";

import { useState } from "react";
import { MessageCircle, X, Minimize2 } from "lucide-react";
import { ContactAgentChat } from "./ContactAgentChat";
import { BasicInfoBot } from "./BasicInfoBot";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession } from "next-auth/react";

interface FloatingContactAgentProps {
  sessionContext?: {
    state?: string;
    county?: string;
    claimType?: string;
  };
}

export function FloatingContactAgent({
  sessionContext,
}: FloatingContactAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { data: session } = useSession();

  // Determine if user has paid tier access
  // For paid customers: CUSTOMER role with paid service tier
  // Free tier: unauthenticated or free plan
  const hasPaidAccess = session?.user?.role === "CUSTOMER";

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        {/* Floating Button */}
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg transition-all hover:shadow-xl"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>

        {/* Tooltip */}
        <div className="pointer-events-none absolute bottom-full right-0 mb-2 opacity-0 transition-opacity hover:opacity-100">
          <div className="whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-sm text-white">
            {hasPaidAccess
              ? "Need help finding contacts?"
              : "Have questions about RECA?"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card
        className={`${isMinimized ? "h-14 w-80" : "h-[600px] w-96"} flex flex-col shadow-2xl transition-all duration-200`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between rounded-t-lg border-b p-3 text-white ${
            hasPaidAccess ? "bg-blue-600" : "bg-terracotta-500"
          }`}
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <h3 className="font-semibold">
              {hasPaidAccess ? "Contact Finder" : "RECA Info Assistant"}
            </h3>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className={`h-8 w-8 p-0 text-white ${
                hasPaidAccess ? "hover:bg-blue-700" : "hover:bg-terracotta-600"
              }`}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className={`h-8 w-8 p-0 text-white ${
                hasPaidAccess ? "hover:bg-blue-700" : "hover:bg-terracotta-600"
              }`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chat Content */}
        {!isMinimized && (
          <div className="flex-1 overflow-hidden">
            {hasPaidAccess ? (
              <ContactAgentChat sessionContext={sessionContext} />
            ) : (
              <BasicInfoBot />
            )}
          </div>
        )}

        {/* Minimized Preview */}
        {isMinimized && (
          <div className="p-3 text-sm text-muted-foreground">
            {hasPaidAccess
              ? "Click to expand and find institutional contacts..."
              : "Click to expand and learn about RECA eligibility..."}
          </div>
        )}
      </Card>
    </div>
  );
}
