"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RECA_GLOSSARY } from "@/lib/reca/glossary";

interface GlossaryTermProps {
  /** The glossary key — must match a key in RECA_GLOSSARY */
  term: string;
  /** Optional display text (defaults to the term itself) */
  children?: React.ReactNode;
}

/**
 * Inline glossary term with click-to-reveal definition.
 *
 * Renders the term with a dotted underline. On click, shows a popover
 * with the plain-language definition from the RECA glossary.
 *
 * Usage: <GlossaryTerm term="certified copy" />
 * Or:    <GlossaryTerm term="certified copy">certified copies</GlossaryTerm>
 */
export function GlossaryTerm({ term, children }: GlossaryTermProps) {
  const definition = RECA_GLOSSARY[term.toLowerCase()];

  if (!definition) {
    // If term not in glossary, render as plain text
    return <span>{children || term}</span>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="cursor-help border-b border-dotted border-sage-400 text-inherit hover:border-terracotta-500 hover:text-terracotta-700"
        >
          {children || term}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 text-sm" side="top">
        <p className="mb-1 font-semibold text-sage-900">{term}</p>
        <p className="text-sage-700">{definition}</p>
      </PopoverContent>
    </Popover>
  );
}
