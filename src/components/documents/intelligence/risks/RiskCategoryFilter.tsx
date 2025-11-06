import { Button } from "@/components/ui/button";
import { FileText, Shield, Image, RefreshCw, ShieldAlert } from "lucide-react";
import type { FilterCategory } from "./helpers";
import type { DocumentRiskSummary } from "./useDocumentRiskData";

interface RiskCategoryFilterProps {
  value: FilterCategory;
  onChange: (category: FilterCategory) => void;
  summary: DocumentRiskSummary;
}

const categoryIcons = {
  compliance: FileText,
  eligibility: Shield,
  quality: Image,
  consistency: RefreshCw,
  authenticity: ShieldAlert,
};

export function RiskCategoryFilter({
  value,
  onChange,
  summary,
}: RiskCategoryFilterProps) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-3 text-lg font-semibold">Filter By Category</h3>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={value === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => onChange("all")}
          disabled={summary.total === 0}
        >
          All ({summary.total})
        </Button>
        {(
          Object.keys(summary.byCategory) as Array<
            keyof typeof summary.byCategory
          >
        ).map((category) => {
          const count = summary.byCategory[category];
          const Icon = categoryIcons[category];
          return (
            <Button
              key={category}
              variant={value === category ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(category)}
              disabled={count === 0}
            >
              <Icon className="mr-1 h-3 w-3" />
              {capitalize(category)} ({count})
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
