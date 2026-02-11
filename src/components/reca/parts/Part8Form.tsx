"use client";

import { useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Part8Exposure } from "@/lib/reca/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FieldLabel } from "@/components/reca/FieldLabel";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Info, MapPin } from "lucide-react";

// Validation schema
const affectedAreaSchema = z.object({
  state: z.enum(["Idaho", "New Mexico", "Utah"], {
    required_error: "State is required",
  }),
  townCity: z.string().min(1, "Town/City is required"),
  timePeriod: z.string().min(1, "Time period is required"),
});

const arizonaCountySchema = z.object({
  county: z.enum(
    ["Coconino", "Yavapai", "Navajo", "Apache", "Gila", "Mohave"],
    {
      required_error: "County is required",
    }
  ),
  townCity: z.string().min(1, "Town/City is required"),
  timePeriod: z.string().min(1, "Time period is required"),
});

const nevadaCountySchema = z.object({
  county: z.enum(
    [
      "White Pine",
      "Nye",
      "Lander",
      "Lincoln",
      "Eureka",
      "Clark (townships 13-16, ranges 63-71)",
    ],
    {
      required_error: "County is required",
    }
  ),
  townCity: z.string().min(1, "Town/City is required"),
  timePeriod: z.string().min(1, "Time period is required"),
});

const part8Schema = z
  .object({
    exposureOptions: z
      .array(z.enum(["option_1a", "option_1b", "option_2"]))
      .min(1, "You must select at least one exposure option"),
    affectedAreas: z.array(affectedAreaSchema).optional(),
    arizonaCounties: z.array(arizonaCountySchema).optional(),
    nevadaCounties: z.array(nevadaCountySchema).optional(),
  })
  .refine(
    (data) => {
      // Ensure at least one location is provided
      const hasAffectedAreas =
        data.affectedAreas && data.affectedAreas.length > 0;
      const hasArizonaCounties =
        data.arizonaCounties && data.arizonaCounties.length > 0;
      const hasNevadaCounties =
        data.nevadaCounties && data.nevadaCounties.length > 0;
      return hasAffectedAreas || hasArizonaCounties || hasNevadaCounties;
    },
    {
      message: "You must provide at least one location with time period",
      path: ["affectedAreas"],
    }
  );

type Part8FormData = z.infer<typeof part8Schema>;

interface Part8FormProps {
  initialData?: Partial<Part8Exposure>;
  onSubmit: (data: Part8Exposure) => void;
}

export default function Part8Form({ initialData, onSubmit }: Part8FormProps) {
  const form = useForm<Part8FormData>({
    resolver: zodResolver(part8Schema),
    defaultValues: {
      exposureOptions: initialData?.exposureOptions || [],
      affectedAreas: initialData?.affectedAreas || [],
      arizonaCounties: initialData?.arizonaCounties || [],
      nevadaCounties: initialData?.nevadaCounties || [],
    },
  });

  const {
    fields: affectedAreasFields,
    append: appendAffectedArea,
    remove: removeAffectedArea,
  } = useFieldArray({
    control: form.control,
    name: "affectedAreas",
  });

  const {
    fields: arizonaCountiesFields,
    append: appendArizonaCounty,
    remove: removeArizonaCounty,
  } = useFieldArray({
    control: form.control,
    name: "arizonaCounties",
  });

  const {
    fields: nevadaCountiesFields,
    append: appendNevadaCounty,
    remove: removeNevadaCounty,
  } = useFieldArray({
    control: form.control,
    name: "nevadaCounties",
  });

  // Auto-submit when form data changes and valid
  useEffect(() => {
    const subscription = form.watch(() => {
      const values = form.getValues();
      if (form.formState.isValid) {
        onSubmit(values as Part8Exposure);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onSubmit]);

  // Non-blocking submit for FormWizard navigation — saves partial data and always allows progression
  const handlePartialSubmit = useCallback(
    async (data: any) => {
      onSubmit(data as Part8Exposure);
    },
    [onSubmit]
  );

  useEffect(() => {
    (window as any).__currentFormSubmit = async () => {
      return new Promise<boolean>((resolve) => {
        form.handleSubmit(
          async (data) => {
            await handlePartialSubmit(data);
            resolve(true);
          },
          async () => {
            // Save whatever data we have, even if invalid
            const formData = form.getValues();
            await handlePartialSubmit(formData);
            resolve(true); // Always allow progression
          }
        )();
      });
    };
    return () => {
      delete (window as any).__currentFormSubmit;
    };
  }, [form, handlePartialSubmit]);

  const handleCheckboxChange = (
    option: "option_1a" | "option_1b" | "option_2",
    checked: boolean
  ) => {
    const currentOptions = form.getValues("exposureOptions");
    if (checked) {
      form.setValue("exposureOptions", [...currentOptions, option]);
    } else {
      form.setValue(
        "exposureOptions",
        currentOptions.filter((o) => o !== option)
      );
    }
  };

  const exposureOptions = form.watch("exposureOptions");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sage-900">
            <MapPin className="h-5 w-5 text-terracotta-500" />
            Part 8: Exposure Information
          </CardTitle>
          <CardDescription>
            Physical presence requirements in designated affected areas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Eligibility Criteria Info */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="mb-2 font-semibold text-amber-900">
                  Eligibility Requirements
                </p>
                <p className="mb-3 text-sm text-amber-800">
                  You must meet at least ONE of the following presence
                  requirements:
                </p>
                <ul className="list-inside list-disc space-y-1 text-sm text-amber-800">
                  <li>
                    <strong>Option 1a:</strong> Designated affected area for at
                    least one year (January 21, 1951 - November 6, 1962)
                  </li>
                  <li>
                    <strong>Option 1b:</strong> Designated affected area for
                    entire period (June 30, 1962 - July 31, 1962)
                  </li>
                  <li>
                    <strong>Option 2:</strong> State of New Mexico for at least
                    one year (September 24, 1944 - November 6, 1962)
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Exposure Options Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold text-sage-900">
              Select all time periods when the claimant was physically present *
            </Label>

            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-md border border-sage-200 p-4 hover:bg-sage-50">
                <Checkbox
                  id="option_1a"
                  checked={exposureOptions.includes("option_1a")}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange("option_1a", checked as boolean)
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <FieldLabel
                    htmlFor="option_1a"
                    importance="required"
                    className="cursor-pointer text-sm font-medium leading-none"
                  >
                    Designated affected area - at least one year
                  </FieldLabel>
                  <p className="mt-1 text-sm text-sage-600">
                    January 21, 1951 - November 6, 1962
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-md border border-sage-200 p-4 hover:bg-sage-50">
                <Checkbox
                  id="option_1b"
                  checked={exposureOptions.includes("option_1b")}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange("option_1b", checked as boolean)
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <FieldLabel
                    htmlFor="option_1b"
                    importance="required"
                    className="cursor-pointer text-sm font-medium leading-none"
                  >
                    Designated affected area - entire period
                  </FieldLabel>
                  <p className="mt-1 text-sm text-sage-600">
                    June 30, 1962 - July 31, 1962
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-md border border-sage-200 p-4 hover:bg-sage-50">
                <Checkbox
                  id="option_2"
                  checked={exposureOptions.includes("option_2")}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange("option_2", checked as boolean)
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <FieldLabel
                    htmlFor="option_2"
                    importance="required"
                    className="cursor-pointer text-sm font-medium leading-none"
                  >
                    State of New Mexico - at least one year
                  </FieldLabel>
                  <p className="mt-1 text-sm text-sage-600">
                    September 24, 1944 - November 6, 1962
                  </p>
                </div>
              </div>
            </div>

            {form.formState.errors.exposureOptions && (
              <p className="text-sm text-red-600">
                {form.formState.errors.exposureOptions.message}
              </p>
            )}
          </div>

          {/* Affected Areas (Idaho, New Mexico, Utah) */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold text-sage-900">
                  Designated Affected Areas
                </Label>
                <p className="mt-1 text-sm text-sage-600">
                  Idaho, New Mexico, or Utah locations
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendAffectedArea({
                    state: "Utah",
                    townCity: "",
                    timePeriod: "",
                  })
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Location
              </Button>
            </div>

            {affectedAreasFields.map((field, index) => (
              <div
                key={field.id}
                className="space-y-3 rounded-md border border-sage-200 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-sage-700">
                    Location {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAffectedArea(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <FieldLabel
                    htmlFor={`affectedAreas.${index}.state`}
                    importance="required"
                  >
                    State <span className="text-red-600">*</span>
                  </FieldLabel>
                  <select
                    id={`affectedAreas.${index}.state`}
                    className="flex h-10 w-full rounded-md border border-sage-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500"
                    {...form.register(`affectedAreas.${index}.state`)}
                  >
                    <option value="">Select state</option>
                    <option value="Idaho">Idaho</option>
                    <option value="New Mexico">New Mexico</option>
                    <option value="Utah">Utah</option>
                  </select>
                  {form.formState.errors.affectedAreas?.[index]?.state && (
                    <p className="text-sm text-red-600">
                      {
                        form.formState.errors.affectedAreas[index].state
                          ?.message
                      }
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <FieldLabel
                    htmlFor={`affectedAreas.${index}.townCity`}
                    importance="required"
                  >
                    Town or City <span className="text-red-600">*</span>
                  </FieldLabel>
                  <input
                    id={`affectedAreas.${index}.townCity`}
                    type="text"
                    className="flex h-10 w-full rounded-md border border-sage-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500"
                    {...form.register(`affectedAreas.${index}.townCity`)}
                  />
                  {form.formState.errors.affectedAreas?.[index]?.townCity && (
                    <p className="text-sm text-red-600">
                      {
                        form.formState.errors.affectedAreas[index].townCity
                          ?.message
                      }
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <FieldLabel
                    htmlFor={`affectedAreas.${index}.timePeriod`}
                    importance="required"
                  >
                    Time Period <span className="text-red-600">*</span>
                  </FieldLabel>
                  <input
                    id={`affectedAreas.${index}.timePeriod`}
                    type="text"
                    placeholder="e.g., January 1952 - December 1955"
                    className="flex h-10 w-full rounded-md border border-sage-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500"
                    {...form.register(`affectedAreas.${index}.timePeriod`)}
                  />
                  <p className="text-sm text-sage-600">
                    Dates of presence in this location
                  </p>
                  {form.formState.errors.affectedAreas?.[index]?.timePeriod && (
                    <p className="text-sm text-red-600">
                      {
                        form.formState.errors.affectedAreas[index].timePeriod
                          ?.message
                      }
                    </p>
                  )}
                </div>
              </div>
            ))}

            {affectedAreasFields.length === 0 && (
              <p className="text-sm italic text-sage-600">
                No locations added yet. Click "Add Location" to begin.
              </p>
            )}
          </div>

          {/* Arizona Counties */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold text-sage-900">
                  Arizona Locations
                </Label>
                <p className="mt-1 text-sm text-sage-600">
                  Specific counties: Coconino, Yavapai, Navajo, Apache, Gila,
                  Mohave
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendArizonaCounty({
                    county: "Coconino",
                    townCity: "",
                    timePeriod: "",
                  })
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Arizona Location
              </Button>
            </div>

            {arizonaCountiesFields.map((field, index) => (
              <div
                key={field.id}
                className="space-y-3 rounded-md border border-sage-200 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-sage-700">
                    Arizona Location {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArizonaCounty(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <FieldLabel
                    htmlFor={`arizonaCounties.${index}.county`}
                    importance="required"
                  >
                    County <span className="text-red-600">*</span>
                  </FieldLabel>
                  <select
                    id={`arizonaCounties.${index}.county`}
                    className="flex h-10 w-full rounded-md border border-sage-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500"
                    {...form.register(`arizonaCounties.${index}.county`)}
                  >
                    <option value="">Select county</option>
                    <option value="Coconino">Coconino</option>
                    <option value="Yavapai">Yavapai</option>
                    <option value="Navajo">Navajo</option>
                    <option value="Apache">Apache</option>
                    <option value="Gila">Gila</option>
                    <option value="Mohave">Mohave</option>
                  </select>
                  {form.formState.errors.arizonaCounties?.[index]?.county && (
                    <p className="text-sm text-red-600">
                      {
                        form.formState.errors.arizonaCounties[index].county
                          ?.message
                      }
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <FieldLabel
                    htmlFor={`arizonaCounties.${index}.townCity`}
                    importance="required"
                  >
                    Town or City <span className="text-red-600">*</span>
                  </FieldLabel>
                  <input
                    id={`arizonaCounties.${index}.townCity`}
                    type="text"
                    className="flex h-10 w-full rounded-md border border-sage-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500"
                    {...form.register(`arizonaCounties.${index}.townCity`)}
                  />
                  {form.formState.errors.arizonaCounties?.[index]?.townCity && (
                    <p className="text-sm text-red-600">
                      {
                        form.formState.errors.arizonaCounties[index].townCity
                          ?.message
                      }
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <FieldLabel
                    htmlFor={`arizonaCounties.${index}.timePeriod`}
                    importance="required"
                  >
                    Time Period <span className="text-red-600">*</span>
                  </FieldLabel>
                  <input
                    id={`arizonaCounties.${index}.timePeriod`}
                    type="text"
                    placeholder="e.g., January 1952 - December 1955"
                    className="flex h-10 w-full rounded-md border border-sage-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500"
                    {...form.register(`arizonaCounties.${index}.timePeriod`)}
                  />
                  <p className="text-sm text-sage-600">
                    Dates of presence in this location
                  </p>
                  {form.formState.errors.arizonaCounties?.[index]
                    ?.timePeriod && (
                    <p className="text-sm text-red-600">
                      {
                        form.formState.errors.arizonaCounties[index].timePeriod
                          ?.message
                      }
                    </p>
                  )}
                </div>
              </div>
            ))}

            {arizonaCountiesFields.length === 0 && (
              <p className="text-sm italic text-sage-600">
                No Arizona locations added yet.
              </p>
            )}
          </div>

          {/* Nevada Counties */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold text-sage-900">
                  Nevada Locations
                </Label>
                <p className="mt-1 text-sm text-sage-600">
                  Specific counties: White Pine, Nye, Lander, Lincoln, Eureka,
                  Clark
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendNevadaCounty({
                    county: "Nye",
                    townCity: "",
                    timePeriod: "",
                  })
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Nevada Location
              </Button>
            </div>

            {nevadaCountiesFields.map((field, index) => (
              <div
                key={field.id}
                className="space-y-3 rounded-md border border-sage-200 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-sage-700">
                    Nevada Location {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeNevadaCounty(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <FieldLabel
                    htmlFor={`nevadaCounties.${index}.county`}
                    importance="required"
                  >
                    County <span className="text-red-600">*</span>
                  </FieldLabel>
                  <select
                    id={`nevadaCounties.${index}.county`}
                    className="flex h-10 w-full rounded-md border border-sage-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500"
                    {...form.register(`nevadaCounties.${index}.county`)}
                  >
                    <option value="">Select county</option>
                    <option value="White Pine">White Pine</option>
                    <option value="Nye">Nye</option>
                    <option value="Lander">Lander</option>
                    <option value="Lincoln">Lincoln</option>
                    <option value="Eureka">Eureka</option>
                    <option value="Clark (townships 13-16, ranges 63-71)">
                      Clark (townships 13-16, ranges 63-71)
                    </option>
                  </select>
                  {form.formState.errors.nevadaCounties?.[index]?.county && (
                    <p className="text-sm text-red-600">
                      {
                        form.formState.errors.nevadaCounties[index].county
                          ?.message
                      }
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <FieldLabel
                    htmlFor={`nevadaCounties.${index}.townCity`}
                    importance="required"
                  >
                    Town or City <span className="text-red-600">*</span>
                  </FieldLabel>
                  <input
                    id={`nevadaCounties.${index}.townCity`}
                    type="text"
                    className="flex h-10 w-full rounded-md border border-sage-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500"
                    {...form.register(`nevadaCounties.${index}.townCity`)}
                  />
                  {form.formState.errors.nevadaCounties?.[index]?.townCity && (
                    <p className="text-sm text-red-600">
                      {
                        form.formState.errors.nevadaCounties[index].townCity
                          ?.message
                      }
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <FieldLabel
                    htmlFor={`nevadaCounties.${index}.timePeriod`}
                    importance="required"
                  >
                    Time Period <span className="text-red-600">*</span>
                  </FieldLabel>
                  <input
                    id={`nevadaCounties.${index}.timePeriod`}
                    type="text"
                    placeholder="e.g., January 1952 - December 1955"
                    className="flex h-10 w-full rounded-md border border-sage-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500"
                    {...form.register(`nevadaCounties.${index}.timePeriod`)}
                  />
                  <p className="text-sm text-sage-600">
                    Dates of presence in this location
                  </p>
                  {form.formState.errors.nevadaCounties?.[index]
                    ?.timePeriod && (
                    <p className="text-sm text-red-600">
                      {
                        form.formState.errors.nevadaCounties[index].timePeriod
                          ?.message
                      }
                    </p>
                  )}
                </div>
              </div>
            ))}

            {nevadaCountiesFields.length === 0 && (
              <p className="text-sm italic text-sage-600">
                No Nevada locations added yet.
              </p>
            )}
          </div>

          {/* General validation error */}
          {form.formState.errors.affectedAreas &&
            typeof form.formState.errors.affectedAreas.message === "string" && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-600">
                  {form.formState.errors.affectedAreas.message}
                </p>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Card className="border-terracotta-200 bg-terracotta-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-terracotta-600" />
            <div>
              <p className="mb-1 font-semibold text-terracotta-900">
                Important
              </p>
              <p className="text-sm text-terracotta-800">
                If the claimant was not physically present in any listed areas
                for the required time period, they are not eligible for
                compensation under the RECA program. In the next section, you
                will need to provide documentation proving presence in these
                locations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
