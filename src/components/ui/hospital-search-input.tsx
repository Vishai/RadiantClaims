"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Check, Building2, X, Loader2 } from "lucide-react";
import { Command, CommandEmpty, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface Hospital {
  id?: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  yearOpened?: number;
  yearClosed?: number;
  stillOperating?: boolean;
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

  // Remove auto-search - we'll use manual trigger instead
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     if (open && searchTerm.length >= 2) {
  //       searchHospitals(searchTerm);
  //     }
  //   }, 400);
  //   return () => clearTimeout(timer);
  // }, [searchTerm, open, defaultState, defaultCity]);

  const searchHospitals = async (query: string) => {
    console.log("[HospitalSearch] Starting search for:", query);
    setLoading(true);
    setResults([]); // Clear previous results

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

      const url = `/api/resources/search?${params.toString()}`;
      console.log("[HospitalSearch] Fetching URL:", url);

      const response = await fetch(url);
      console.log(
        "[HospitalSearch] Response status:",
        response.status,
        response.ok
      );

      if (response.ok) {
        const data = await response.json();
        console.log("[HospitalSearch] API Response:", data);
        console.log("[HospitalSearch] Results Type:", data.resultsType);
        console.log(
          "[HospitalSearch] Resources count:",
          data.resources?.length
        );
        console.log("[HospitalSearch] Raw resources:", data.resources);

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
        console.log("[HospitalSearch] Setting results state...");
        setResults(mappedResults);
        console.log("[HospitalSearch] Results state set!");
      } else {
        console.error(
          "[HospitalSearch] API returned non-OK status:",
          response.status
        );
      }
    } catch (error) {
      console.error("[HospitalSearch] Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (hospital: Hospital) => {
    console.log("[HospitalSearch] handleSelect called with:", hospital);
    console.log("[HospitalSearch] onSelect callback exists?", !!onSelect);

    setSelectedHospital(hospital);
    setSearchTerm(hospital.name);
    onChange(hospital.name);

    if (onSelect) {
      console.log("[HospitalSearch] Calling onSelect callback...");
      onSelect(hospital);
      console.log("[HospitalSearch] onSelect callback completed");
    } else {
      console.warn("[HospitalSearch] No onSelect callback provided!");
    }

    // Keep results open so user can see what was selected
    // setOpen(false); // Don't close - let user dismiss manually
  };

  const handleClear = () => {
    setSelectedHospital(null);
    onChange("");
    setSearchTerm("");
    if (onClear) onClear();
    inputRef.current?.focus();
  };

  const handleSearchClick = () => {
    if (searchTerm.length >= 2) {
      setOpen(true);
      searchHospitals(searchTerm);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
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
              onChange(e.target.value);
              setSelectedHospital(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearchClick();
              }
            }}
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
        <Button
          type="button"
          onClick={handleSearchClick}
          disabled={loading || searchTerm.length < 2}
          className="flex-shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Search
            </>
          )}
        </Button>
      </div>

      {/* Search Results Popover */}
      {open && (
        <div className="relative mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          {/* Close button */}
          <button
            onClick={() => setOpen(false)}
            className="absolute right-2 top-2 z-10 rounded-full bg-gray-100 p-1 hover:bg-gray-200"
            aria-label="Close results"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>

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
                <div className="p-2">
                  <p className="mb-2 px-2 text-xs font-semibold text-gray-500">
                    Best Matches - Click to Select
                  </p>
                  {results.map((hospital) => (
                    <button
                      key={hospital.id || hospital.name}
                      type="button"
                      onClick={(e) => {
                        console.log(
                          "[Hospital Button] onClick fired for:",
                          hospital.name
                        );
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelect(hospital);
                      }}
                      className="flex w-full cursor-pointer items-start gap-3 rounded-lg border-b border-gray-100 p-4 text-left transition-colors last:border-b-0 hover:bg-blue-50"
                    >
                      <Building2 className="mt-1 h-5 w-5 flex-shrink-0 text-blue-600" />
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {hospital.name}
                          </span>
                          {hospital.id?.startsWith("web-") && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                              Web Result
                            </span>
                          )}
                        </div>

                        {/* Address line */}
                        {hospital.address && (
                          <p className="text-sm text-gray-600">
                            {hospital.address}
                          </p>
                        )}

                        {/* City, State, Zip line */}
                        {(hospital.city || hospital.state) && (
                          <p className="text-sm text-gray-600">
                            {hospital.city && `${hospital.city}, `}
                            {hospital.state}
                            {hospital.zip && ` ${hospital.zip}`}
                          </p>
                        )}

                        {/* Phone number */}
                        {hospital.phone && (
                          <p className="mt-1 text-sm font-medium text-gray-700">
                            📞 {hospital.phone}
                          </p>
                        )}

                        {/* Operation Status */}
                        {(hospital.yearOpened ||
                          hospital.stillOperating !== undefined) && (
                          <div className="mt-2 flex items-center gap-3 text-xs">
                            {hospital.yearOpened && (
                              <span className="text-gray-600">
                                Opened: {hospital.yearOpened}
                              </span>
                            )}
                            {hospital.stillOperating === true && (
                              <span className="font-medium text-green-600">
                                ✓ Operating
                              </span>
                            )}
                            {hospital.stillOperating === false &&
                              hospital.yearClosed && (
                                <span className="font-medium text-amber-600">
                                  Closed: {hospital.yearClosed}
                                </span>
                              )}
                          </div>
                        )}
                      </div>

                      {selectedHospital?.name === hospital.name ? (
                        <Check className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                      ) : (
                        <div className="mt-1 text-xs text-blue-600">
                          Click to select
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div className="border-t border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
                <strong>Note:</strong> These are our best guesses. Please verify
                the specific facility name if known.
              </div>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
