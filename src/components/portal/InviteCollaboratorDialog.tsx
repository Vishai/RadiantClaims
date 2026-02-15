"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export function InviteCollaboratorDialog({
  open,
  onOpenChange,
  intakeSessionId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intakeSessionId: string | null;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail("");
      setName("");
      setSending(false);
      setGeneratedUrl(null);
      setCopied(false);
    }
  }, [open]);

  const handleSend = async () => {
    if (!email || !intakeSessionId) return;
    setSending(true);
    try {
      const res = await fetch("/api/portal/collaborators/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intakeSessionId,
          email,
          name: name || undefined,
          role: "CONTRIBUTOR",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to invite collaborator");
      }

      setGeneratedUrl(data.invite?.acceptUrl || null);

      if (data?.emailSent === false) {
        // Still show the link, but warn the user the email didn't go out.
        alert(
          data?.emailError
            ? `Invite created, but email failed to send: ${data.emailError}`
            : "Invite created, but email failed to send."
        );
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to send invite");
    } finally {
      setSending(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedUrl) return;
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {generatedUrl ? "Invite sent" : "Invite a sibling"}
          </DialogTitle>
          <DialogDescription>
            {generatedUrl
              ? "We emailed the invite. If they don’t see it, you can copy the link below. They’ll need to sign in (or create an account) to view the claim and upload documents."
              : "Invite a family member to view this claim, upload documents, and leave notes. They cannot edit your answers."}
          </DialogDescription>
        </DialogHeader>

        {generatedUrl ? (
          <div className="space-y-3 py-2">
            <div className="flex gap-2">
              <Input value={generatedUrl} readOnly className="bg-sage-50" />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-sage-500">
              (Email sending can be wired up next. For now, copy/paste this
              link.)
            </p>
          </div>
        ) : (
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {generatedUrl ? (
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Done
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={sending || !email}>
                {sending ? "Inviting..." : "Invite"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
