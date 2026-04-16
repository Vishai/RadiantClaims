"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Copy-to-clipboard button for the daily DOJ post draft. Shows a
 * check mark for 2 seconds after a successful copy so the operator
 * has clear feedback on mobile (no hover states to rely on).
 */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard write failed:", err);
      // Fallback: select the source element and prompt manual copy
      alert("Copy failed. Please select the text manually.");
    }
  };

  return (
    <Button
      onClick={onCopy}
      className="gap-2 rounded-full bg-sage-800 text-white hover:bg-sage-900"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy to clipboard
        </>
      )}
    </Button>
  );
}
