"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DateRange, DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import "react-day-picker/dist/style.css";

interface DateRangePickerProps {
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  placeholder?: string;
}

export function DateRangePicker({
  date,
  onDateChange,
  placeholder = "Pick a date range",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateChange(undefined);
  };

  return (
    <div className="relative">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <DayPicker
            mode="range"
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={2}
            defaultMonth={date?.from}
          />
          <div className="border-t p-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                onDateChange(undefined);
                setIsOpen(false);
              }}
            >
              Clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {date && (
        <button
          onClick={handleClear}
          className="absolute right-8 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-gray-100"
        >
          <X className="h-3 w-3 text-gray-500" />
        </button>
      )}
    </div>
  );
}
