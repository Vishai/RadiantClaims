"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Info, AlertCircle, CheckCircle, Users } from "lucide-react";

export default function SurvivorHierarchyTable() {
  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card className="border-2 border-sage-200 bg-gradient-to-br from-sage-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sage-900">
            <Users className="h-5 w-5 text-terracotta-500" />
            RECA Survivor Compensation Overview
          </CardTitle>
          <CardDescription>
            Understanding the payment hierarchy and eligibility requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div>
                <p className="mb-2 text-sm font-semibold text-blue-900">
                  How Survivor Payments Work
                </p>
                <p className="mb-2 text-sm text-blue-800">
                  The Radiation Exposure Compensation Act (RECA) establishes a{" "}
                  <strong>strict order of priority</strong> for distributing
                  payments to survivors when a qualified individual has passed
                  away.
                </p>
                <p className="text-sm text-blue-800">
                  Payment is divided equally among all eligible members in the
                  highest qualifying category. If no one qualifies in that
                  category, the Department of Justice (DOJ) moves to the next
                  group in the hierarchy.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hierarchy Table */}
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900">
            Survivor Payment Hierarchy
          </CardTitle>
          <CardDescription>
            Listed in order of priority - highest to lowest
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-sage-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-sage-100">
                  <TableHead className="w-24 font-bold text-sage-900">
                    Priority
                  </TableHead>
                  <TableHead className="w-48 font-bold text-sage-900">
                    Survivor Category
                  </TableHead>
                  <TableHead className="font-bold text-sage-900">
                    Eligibility & Rights
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-sage-50">
                  <TableCell className="text-2xl font-bold text-terracotta-600">
                    1
                  </TableCell>
                  <TableCell className="font-semibold text-sage-900">
                    Surviving Spouse
                  </TableCell>
                  <TableCell className="text-sage-700">
                    Receives the full payment if married to the decedent for{" "}
                    <strong>at least one year immediately before death</strong>{" "}
                    and alive at the time of payment.
                  </TableCell>
                </TableRow>

                <TableRow className="bg-cream-50/50 hover:bg-sage-50">
                  <TableCell className="text-2xl font-bold text-terracotta-600">
                    2
                  </TableCell>
                  <TableCell className="font-semibold text-sage-900">
                    Children
                  </TableCell>
                  <TableCell className="text-sage-700">
                    If no eligible spouse, all living biological or legally
                    adopted children share the payment equally.
                  </TableCell>
                </TableRow>

                <TableRow className="hover:bg-sage-50">
                  <TableCell className="text-2xl font-bold text-terracotta-600">
                    3
                  </TableCell>
                  <TableCell className="font-semibold text-sage-900">
                    Parents
                  </TableCell>
                  <TableCell className="text-sage-700">
                    If no spouse or children, surviving parents share equally.
                  </TableCell>
                </TableRow>

                <TableRow className="bg-cream-50/50 hover:bg-sage-50">
                  <TableCell className="text-2xl font-bold text-terracotta-600">
                    4
                  </TableCell>
                  <TableCell className="font-semibold text-sage-900">
                    Grandchildren
                  </TableCell>
                  <TableCell className="text-sage-700">
                    If no spouse, children, or parents, surviving grandchildren
                    share equally.
                  </TableCell>
                </TableRow>

                <TableRow className="hover:bg-sage-50">
                  <TableCell className="text-2xl font-bold text-terracotta-600">
                    5
                  </TableCell>
                  <TableCell className="font-semibold text-sage-900">
                    Grandparents
                  </TableCell>
                  <TableCell className="text-sage-700">
                    If no spouse, children, parents, or grandchildren, surviving
                    grandparents share equally.
                  </TableCell>
                </TableRow>

                <TableRow className="bg-cream-50/50 hover:bg-sage-50">
                  <TableCell className="text-2xl font-bold text-terracotta-600">
                    6
                  </TableCell>
                  <TableCell className="font-semibold text-sage-900">
                    Authorized Agents / Estates
                  </TableCell>
                  <TableCell className="text-sage-700">
                    Only paid if specifically named or legally authorized when
                    no qualifying survivor exists.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Key Rules */}
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900">
            Key Rules & Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
              <div>
                <p className="font-semibold text-sage-900">
                  One Claim Per Category
                </p>
                <p className="text-sm text-sage-700">
                  All eligible individuals (e.g., all surviving children) must
                  be listed together on the same claim form. Missing names or
                  false statements can delay or invalidate a claim.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
              <div>
                <p className="font-semibold text-sage-900">
                  Verification Required
                </p>
                <p className="text-sm text-sage-700">
                  The DOJ verifies completeness and accuracy. Each beneficiary
                  must provide proof of relationship (e.g., birth, marriage, or
                  adoption certificates).
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
              <div>
                <p className="font-semibold text-sage-900">
                  Stepchildren Eligibility
                </p>
                <p className="text-sm text-sage-700">
                  Stepchildren are not eligible unless legally adopted or a
                  legally recognized parent-child relationship existed.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
              <div>
                <p className="font-semibold text-sage-900">
                  Surviving Spouse Requirements
                </p>
                <p className="text-sm text-sage-700">
                  A surviving spouse must have been married to the deceased for
                  ≥1 year immediately before death and be alive at time of
                  payment.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
              <div>
                <p className="font-semibold text-sage-900">
                  Native American Marriages
                </p>
                <p className="text-sm text-sage-700">
                  Native American claims may recognize marriages or
                  relationships established under tribal law or custom.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribution Examples */}
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900">Distribution Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="mb-1 text-sm font-semibold text-green-900">
                Example 1: Surviving Spouse
              </p>
              <p className="text-sm text-green-800">
                If a qualifying individual dies with a surviving spouse (married
                ≥1 year), that spouse receives the{" "}
                <strong>full RECA payment</strong>.
              </p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="mb-1 text-sm font-semibold text-blue-900">
                Example 2: Multiple Children
              </p>
              <p className="text-sm text-blue-800">
                If no spouse, the payment is{" "}
                <strong>divided equally among all living children</strong>{" "}
                (including adopted).
              </p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="mb-1 text-sm font-semibold text-amber-900">
                Example 3: Next Generation
              </p>
              <p className="text-sm text-amber-800">
                If no spouse or children, it passes to parents, then
                grandchildren, then grandparents, in order.
              </p>
            </div>

            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
              <p className="mb-1 text-sm font-semibold text-purple-900">
                Example 4: Estate or Agent
              </p>
              <p className="text-sm text-purple-800">
                If no qualifying survivors remain, the estate or a legally
                authorized agent may receive the payment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exclusions */}
      <Card className="rounded-3xl border-2 border-red-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sage-900">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Dependencies & Exclusions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <p className="text-sm text-sage-700">
                <strong>
                  Ex-spouses, former stepchildren, estranged relatives, or
                  non-relatives
                </strong>{" "}
                are not eligible unless legal documentation supports their
                claim.
              </p>
            </div>

            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <p className="text-sm text-sage-700">
                Only{" "}
                <strong>
                  living, eligible individuals at the time of payment
                </strong>{" "}
                can receive funds.
              </p>
            </div>

            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <p className="text-sm text-sage-700">
                If a listed claimant dies before payment, their share may pass
                to the next eligible category or their estate, depending on
                circumstances.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-2 border-terracotta-200 bg-gradient-to-br from-terracotta-50 to-white">
        <CardHeader>
          <CardTitle className="text-sage-900">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sage-800">
            RECA survivor payments follow a{" "}
            <strong>strict legal hierarchy</strong> requiring verified
            documentation and inclusive listing of all eligible family members.
          </p>

          <div className="rounded-lg border border-terracotta-300 bg-terracotta-100 p-4">
            <p className="mb-2 font-semibold text-terracotta-900">
              To avoid disputes or delays, claimants should ensure:
            </p>
            <ol className="list-inside list-decimal space-y-1 text-sm text-terracotta-800">
              <li>
                Every qualifying survivor in the highest category is included
                and signs the claim.
              </li>
              <li>Relationship documentation is provided and certified.</li>
              <li>
                Claims are truthful, consistent, and filed under current DOJ
                RECA guidelines.
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
