"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Check, Building2, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Hospital {
  id?: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
}

interface HospitalSearchInputProps {
  value: string;
  onChange: (name: string) => void;
  onSelect?: (hospital: Hospital) => void;
  onClear?: () => void;
  defaultState?: string;
  defaultCity?: string;
  label?: string;
  placeholder?: string;
}

export function HospitalSearchInput({
  value,
  onChange,
  onSelect,
  onClear,
  defaultState,
  defaultCity,
  label = "Hospital Name",
  placeholder = "Search hospital...",
}: HospitalSearchInputProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [results, setResults] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(
    null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local search term with prop value updates
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (open && searchTerm.length >= 2) {
        searchHospitals(searchTerm);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm, open, defaultState, defaultCity]);

  const searchHospitals = async (query: string) => {
    setLoading(true);
    try {
      // Search using our internal API
      const params = new URLSearchParams({
        resourceType: "HOSPITAL",
        query: query,
      });

      if (defaultState) {
        params.append("state", defaultState);
      }

      if (defaultCity) {
        params.append("city", defaultCity);
      }

      // Using the existing search endpoint - we might need to update it to support 'query' param
      // if it doesn't already, or filter client-side.
      // The current implementation in route.ts filters by state/county/type.
      // We will modify the route.ts to accept a generic 'query' or 'name' filter.

      const response = await fetch(
        `/api/resources/search?${params.toString()}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log("[HospitalSearch] API Response:", data);
        console.log("[HospitalSearch] Results Type:", data.resultsType);
        console.log(
          "[HospitalSearch] Resources count:",
          data.resources?.length
        );

        // Map API response to our Hospital interface
        const mappedResults: Hospital[] = (data.resources || []).map(
          (r: any) => ({
            id: r.id,
            name: r.name,
            address: r.address,
            city: r.city,
            state: r.state,
            zip: r.zip,
            phone: r.phone,
          })
        );
        console.log("[HospitalSearch] Mapped Results:", mappedResults);
        setResults(mappedResults);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setSearchTerm(hospital.name);
    onChange(hospital.name);
    if (onSelect) {
      onSelect(hospital);
    }
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedHospital(null);
    onChange("");
    setSearchTerm("");
    if (onClear) onClear();
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            {selectedHospital ? (
              <Check className="absolute left-3 top-3 h-4 w-4 text-green-600" />
            ) : (
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            )}
            <Input
              ref={inputRef}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                onChange(e.target.value); // Allow typing freely
                setSelectedHospital(null); // Clear selection if typing
              }}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
              className={cn(
                "pl-9 pr-9",
                selectedHospital && "border-green-500 bg-green-50"
              )}
            />
            {searchTerm && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          align="start"
          style={{ width: "var(--radix-popover-trigger-width)" }}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command shouldFilter={false}>
            {" "}
            {/* We handle filtering server-side */}
            <CommandList>
              {loading && (
                <div className="py-6 text-center text-sm text-gray-500">
                  Searching database & web resources...
                </div>
              )}

              {!loading && results.length === 0 && searchTerm.length >= 2 && (
                <CommandEmpty className="py-4 text-center text-sm">
                  <p className="font-medium text-gray-600">
                    No exact match found.
                  </p>
                  <p className="mt-1 text-gray-500">
                    We checked our database and the web.
                  </p>
                  <p className="mt-1 text-gray-500">
                    Use "{searchTerm}" as entered?
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setOpen(false)}
                  >
                    Use Manual Entry
                  </Button>
                </CommandEmpty>
              )}

              {!loading && results.length > 0 && (
                <CommandGroup heading="Best Matches">
                  {results.map((hospital) => (
                    <CommandItem
                      key={hospital.id || hospital.name}
                      value={hospital.name}
                      onSelect={() => handleSelect(hospital)}
                      className="flex items-start gap-2 py-3"
                    >
                      <Building2 className="mt-1 h-4 w-4 flex-shrink-0 text-gray-500" />
                      <div className="flex flex-col">
                        <span className="flex items-center gap-2 font-medium">
                          {hospital.name}
                          {/* Identify web results (ids start with 'web-') */}
                          {hospital.id?.startsWith("web-") && (
                            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">
                              Web Result
                            </span>
                          )}
                        </span>
                        {(hospital.city || hospital.state) && (
                          <span className="text-xs text-gray-500">
                            {hospital.address ? `${hospital.address}, ` : ""}
                            {hospital.city}, {hospital.state}
                          </span>
                        )}
                      </div>
                      {selectedHospital?.name === hospital.name && (
                        <Check className="ml-auto h-4 w-4 text-green-600" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              <div className="border-t border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
                <strong>Note:</strong> These are our best guesses. Please verify
                the specific facility name if known.
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
