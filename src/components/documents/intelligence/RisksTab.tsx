"use client";

import { IntelligenceResponse } from "@/app/api/documents/[id]/intelligence/route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RiskFlag } from "@/lib/document-intelligence/schemas";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Shield,
  Image,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

interface RisksTabProps {
  data: IntelligenceResponse;
}

type SortField = "severity" | "category" | "message";
type SortOrder = "asc" | "desc";
type FilterCategory =
  | "all"
  | "compliance"
  | "eligibility"
  | "quality"
  | "consistency";

export function RisksTab({ data }: RisksTabProps) {
  const { risks } = data;
  const [sortField, setSortField] = useState<SortField>("severity");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [expandedRisks, setExpandedRisks] = useState<Set<number>>(new Set());

  const riskScore = Math.round(risks.overallRiskScore * 100);

  // Get risk score color and label
  const getRiskLevel = (score: number) => {
    if (score >= 70)
      return {
        label: "High Risk",
        color: "text-red-500",
        bgColor: "bg-red-500",
      };
    if (score >= 40)
      return {
        label: "Medium Risk",
        color: "text-yellow-500",
        bgColor: "bg-yellow-500",
      };
    return {
      label: "Low Risk",
      color: "text-green-500",
      bgColor: "bg-green-500",
    };
  };

  const riskLevel = getRiskLevel(riskScore);

  // Category icons
  const categoryIcons = {
    compliance: FileText,
    eligibility: Shield,
    quality: Image,
    consistency: RefreshCw,
  };

  // Severity icons
  const severityEmoji = {
    high: "🔴",
    medium: "🟡",
    low: "🟢",
  };

  // Filter risks
  let filteredRisks = [...risks.risks];
  if (filterCategory !== "all") {
    filteredRisks = filteredRisks.filter(
      (risk) => risk.category === filterCategory
    );
  }

  // Sort risks
  filteredRisks.sort((a, b) => {
    let comparison = 0;

    if (sortField === "severity") {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      comparison = severityOrder[a.severity] - severityOrder[b.severity];
    } else if (sortField === "category") {
      comparison = a.category.localeCompare(b.category);
    } else if (sortField === "message") {
      comparison = a.message.localeCompare(b.message);
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedRisks);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRisks(newExpanded);
  };

  return (
    <div className="space-y-6 py-4">
      {/* Risk Score Gauge */}
      <div className="rounded-lg border p-6">
        <h3 className="mb-4 text-lg font-semibold">Overall Risk Assessment</h3>
        <div className="flex items-center gap-4">
          <div className="relative h-32 w-32">
            {/* Simple circular gauge */}
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${riskScore * 2.51} 251`}
                className={riskLevel.color}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-3xl font-bold ${riskLevel.color}`}>
                {riskScore}%
              </span>
            </div>
          </div>
          <div className="flex-1">
            <p className={`text-2xl font-bold ${riskLevel.color}`}>
              {riskLevel.label}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">High</p>
                <p className="text-xl font-bold text-red-500">
                  {risks.highSeverityCount}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Medium</p>
                <p className="text-xl font-bold text-yellow-500">
                  {risks.mediumSeverityCount}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Low</p>
                <p className="text-xl font-bold text-green-500">
                  {risks.lowSeverityCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-3 text-lg font-semibold">
          Risk Breakdown by Category
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterCategory("all")}
          >
            All ({risks.risks.length})
          </Button>
          {(
            ["compliance", "eligibility", "quality", "consistency"] as const
          ).map((category) => {
            const count = risks.risks.filter(
              (r) => r.category === category
            ).length;
            const Icon = categoryIcons[category];
            return (
              <Button
                key={category}
                variant={filterCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterCategory(category)}
                disabled={count === 0}
              >
                <Icon className="mr-1 h-3 w-3" />
                {category.charAt(0).toUpperCase() + category.slice(1)} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Risks Table */}
      {filteredRisks.length > 0 ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort("severity")}
                >
                  <div className="flex items-center gap-1">
                    Severity
                    {sortField === "severity" &&
                      (sortOrder === "asc" ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      ))}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort("category")}
                >
                  <div className="flex items-center gap-1">
                    Category
                    {sortField === "category" &&
                      (sortOrder === "asc" ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      ))}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort("message")}
                >
                  <div className="flex items-center gap-1">
                    Issue
                    {sortField === "message" &&
                      (sortOrder === "asc" ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      ))}
                  </div>
                </TableHead>
                <TableHead>Action Required</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRisks.map((risk, idx) => {
                const Icon = categoryIcons[risk.category];
                const isExpanded = expandedRisks.has(idx);
                return (
                  <>
                    <TableRow
                      key={idx}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell className="text-center text-lg">
                        {severityEmoji[risk.severity]}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            risk.severity === "high"
                              ? "destructive"
                              : risk.severity === "medium"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {risk.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{risk.category}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {risk.message}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {risk.actionRequired}
                      </TableCell>
                      <TableCell>
                        {risk.details && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleExpanded(idx)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {isExpanded && risk.details && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/30">
                          <div className="p-3 text-sm">
                            <p className="mb-2 font-medium">Details:</p>
                            <p className="text-muted-foreground">
                              {risk.details}
                            </p>
                            {risk.affectedPages &&
                              risk.affectedPages.length > 0 && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                  Affected pages:{" "}
                                  {risk.affectedPages.join(", ")}
                                </p>
                              )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No risks found in this category
        </div>
      )}

      {/* Recommended Actions */}
      {risks.recommendedActions.length > 0 && (
        <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950">
          <h3 className="mb-3 text-lg font-semibold">Recommended Actions</h3>
          <ul className="space-y-2">
            {risks.recommendedActions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 font-bold text-blue-500">→</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
