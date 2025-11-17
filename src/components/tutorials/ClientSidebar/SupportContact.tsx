"use client";

import { Mail, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SupportContact() {
  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-white/90 p-3 shadow-sm">
      <p className="text-sm font-semibold text-foreground">
        Need help from a human?
      </p>
      <div className="space-y-2 text-xs text-muted-foreground">
        <p>
          Our client success team is online 9am–7pm MT, Monday through Friday.
        </p>
        <div className="flex gap-3 text-sm">
          <a
            className="flex items-center gap-1 text-primary"
            href="tel:+18005551212"
          >
            <Phone className="h-3.5 w-3.5" /> (800) 555-1212
          </a>
          <a
            className="flex items-center gap-1 text-primary"
            href="mailto:support@radiantclaims.com"
          >
            <Mail className="h-3.5 w-3.5" /> Email
          </a>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" className="flex-1">
          <MessageCircle className="h-4 w-4" />
          Chat
        </Button>
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <a
            href="https://calendly.com/radiantclaims/support"
            target="_blank"
            rel="noreferrer"
          >
            Schedule
          </a>
        </Button>
      </div>
    </div>
  );
}
