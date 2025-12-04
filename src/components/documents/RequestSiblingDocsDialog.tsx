"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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

interface RequestSiblingDocsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
  defaultName?: string;
  category?: string;
}

export function RequestSiblingDocsDialog({
  open,
  onOpenChange,
  sessionId,
  defaultName,
  category,
}: RequestSiblingDocsDialogProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState(defaultName || "");
  const [sending, setSending] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setName(defaultName || "");
      setEmail("");
      setGeneratedUrl(null);
      setCopied(false);
    }
  }, [open, defaultName]);

  const handleSend = async () => {
    if (!email || !name || !sessionId) return;
    setSending(true);
    try {
      const res = await fetch("/api/portal/siblings/request-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          siblingName: name,
          siblingEmail: email,
          category,
        }),
      });

      if (!res.ok) throw new Error("Failed to send request");

      const data = await res.json();
      if (data.uploadUrl) {
        setGeneratedUrl(data.uploadUrl);
      } else {
        onOpenChange(false);
        alert("Request sent successfully!");
      }
    } catch (error) {
      alert("Failed to send request. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleCopy = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {generatedUrl
              ? "Link Generated!"
              : "Request Documents from Sibling"}
          </DialogTitle>
          <DialogDescription>
            {generatedUrl
              ? "Share this link or QR code with your sibling."
              : `Send a secure upload link to ${name || "your sibling"}. They will receive an email with instructions.`}
          </DialogDescription>
        </DialogHeader>

        {generatedUrl ? (
          <div className="flex flex-col items-center gap-6 py-4">
            {/* QR Code */}
            <div className="rounded-xl border-2 border-dashed border-sage-200 bg-white p-4">
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                  generatedUrl
                )}`}
                alt="QR Code"
                width={150}
                height={150}
                className="h-36 w-36"
              />
            </div>

            {/* URL Copy */}
            <div className="flex w-full gap-2">
              <Input
                value={generatedUrl}
                readOnly
                className="bg-sage-50 text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <p className="text-center text-xs text-sage-500">
              An email has also been sent to {email}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Sibling Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Sibling Email</Label>
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
              <Button
                onClick={handleSend}
                disabled={sending || !email || !name}
              >
                {sending ? "Sending..." : "Send Request"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
