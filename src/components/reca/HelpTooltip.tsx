"use client";

import { HelpCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface HelpTooltipProps {
  /** Plain-language explanation of what this field means */
  explanation: string;
  /** Example value to show the user */
  example?: string;
  /** Where to find this information */
  whereToFind?: string;
}

export function HelpTooltip({
  explanation,
  example,
  whereToFind,
}: HelpTooltipProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full hover:bg-sage-50"
          aria-label="Help"
        >
          <HelpCircle className="h-4 w-4 text-sage-400 hover:text-terracotta-500" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 space-y-2 text-sm"
        side="top"
      >
        <p className="text-sage-800">{explanation}</p>
        {example && (
          <p className="text-sage-500">
            <span className="font-medium text-sage-700">Example: </span>
            <span className="italic">{example}</span>
          </p>
        )}
        {whereToFind && (
          <p className="text-sage-500">
            <span className="font-medium text-sage-700">Where to find: </span>
            {whereToFind}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
