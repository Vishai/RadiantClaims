import * as React from "react";
import { UseFormReturn, FieldPath, FieldValues } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { FieldLabel, type FieldImportance } from "@/components/reca/FieldLabel";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatSSN } from "@/lib/utils";

interface FormFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: FieldPath<T>;
  label: string;
  type?: "text" | "email" | "tel" | "date" | "password" | "select" | "ssn";
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  importance?: FieldImportance;
  maxLength?: number;
  helperText?: string;
}

export function FormField<T extends FieldValues>({
  form,
  name,
  label,
  type = "text",
  placeholder,
  options,
  required = false,
  importance,
  maxLength,
  helperText,
}: FormFieldProps<T>) {
  const error = form.formState.errors[name];

  // Render the label — use FieldLabel when importance is set, otherwise plain Label
  const renderLabel = () =>
    importance ? (
      <FieldLabel htmlFor={name} importance={importance}>
        {label}
      </FieldLabel>
    ) : (
      <Label htmlFor={name}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
    );

  if (type === "select" && options) {
    return (
      <div className="space-y-2">
        {renderLabel()}
        <Select
          onValueChange={(value) => form.setValue(name, value as any)}
          defaultValue={form.getValues(name)}
        >
          <SelectTrigger id={name}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {helperText && !error && (
          <p className="text-xs text-sage-600">{helperText}</p>
        )}
        {error && (
          <p className="text-sm text-destructive">{error.message as string}</p>
        )}
      </div>
    );
  }

  // SSN input with auto-formatting
  if (type === "ssn") {
    return (
      <div className="space-y-2">
        {renderLabel()}
        <Input
          id={name}
          type="text"
          placeholder={placeholder || "XXX-XX-XXXX"}
          maxLength={11}
          {...form.register(name, {
            onChange: (e) => {
              const formatted = formatSSN(e.target.value);
              form.setValue(name, formatted as any);
            },
          })}
        />
        {helperText && !error && (
          <p className="text-xs text-sage-600">{helperText}</p>
        )}
        {error && (
          <p className="text-sm text-destructive">{error.message as string}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {renderLabel()}
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        maxLength={maxLength}
        {...form.register(name)}
      />
      {helperText && !error && (
        <p className="text-xs text-sage-600">{helperText}</p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error.message as string}</p>
      )}
    </div>
  );
}
