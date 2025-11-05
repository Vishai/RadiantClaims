"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  claimType: string | null;
  interestedTier: string | null;
  status: string;
  source: string | null;
  submittedCount: number;
  createdAt: string;
  notificationSent: boolean;
}

export default function AttorneyWaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [tierCounts, setTierCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  const fetchWaitlist = async () => {
    try {
      setIsLoading(true);
      // Filter for LEGAL_REP tier only (attorney path)
      const tierParam = "tier=LEGAL_REP";
      const statusParam = filter ? `&status=${filter}` : "";
      const url = `/api/admin/waitlist?${tierParam}${statusParam}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch waitlist");
      }

      const data = await response.json();
      setEntries(data.entries);
      setCounts(data.counts);
      setTierCounts(data.tierCounts);
    } catch (error) {
      console.error("Error fetching waitlist:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitlist();
  }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch("/api/admin/waitlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Refresh the list
      fetchWaitlist();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const exportToCSV = () => {
    const csv = [
      [
        "Email",
        "Name",
        "Phone",
        "Claim Type",
        "Status",
        "Source",
        "Submitted Count",
        "Created At",
      ],
      ...entries.map((e) => [
        e.email,
        e.name || "",
        e.phone || "",
        e.claimType || "",
        e.status,
        e.source || "",
        e.submittedCount.toString(),
        new Date(e.createdAt).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attorney-leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CONTACTED":
        return "bg-blue-100 text-blue-800";
      case "CONVERTED":
        return "bg-green-100 text-green-800";
      case "DECLINED":
        return "bg-gray-100 text-gray-800";
      case "INVALID":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-sage-900">
          Attorney Path Leads
        </h1>
        <p className="mt-2 text-sage-600">
          Potential clients interested in legal representation
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-emerald-600">
              {counts.PENDING || 0}
            </div>
            <p className="text-sm text-gray-600">Pending Leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{counts.CONTACTED || 0}</div>
            <p className="text-sm text-gray-600">Contacted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{counts.CONVERTED || 0}</div>
            <p className="text-sm text-gray-600">Converted to Clients</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{entries.length}</div>
            <p className="text-sm text-gray-600">Total Attorney Leads</p>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="mb-6 border-l-4 border-l-blue-500 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800">
            <strong>Attorney Path Leads:</strong> These users specifically
            expressed interest in legal representation. They chose the{" "}
            <strong>Legal Rep</strong> service tier during signup.
          </p>
        </CardContent>
      </Card>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-2">
              <Button
                variant={filter === null ? "default" : "outline"}
                onClick={() => setFilter(null)}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={filter === "PENDING" ? "default" : "outline"}
                onClick={() => setFilter("PENDING")}
                size="sm"
              >
                Pending
              </Button>
              <Button
                variant={filter === "CONTACTED" ? "default" : "outline"}
                onClick={() => setFilter("CONTACTED")}
                size="sm"
              >
                Contacted
              </Button>
              <Button
                variant={filter === "CONVERTED" ? "default" : "outline"}
                onClick={() => setFilter("CONVERTED")}
                size="sm"
              >
                Converted
              </Button>
            </div>
            <div className="ml-auto">
              <Button onClick={exportToCSV} variant="outline" size="sm">
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Waitlist Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attorney Path Leads</CardTitle>
          <CardDescription>
            {entries.length} {filter ? filter.toLowerCase() : ""} leads
            interested in legal representation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No attorney path leads found yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Phone</th>
                    <th className="pb-3 font-medium">Claim Type</th>
                    <th className="pb-3 font-medium">Source</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Interest Level</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b last:border-0">
                      <td className="py-3">
                        <a
                          href={`mailto:${entry.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {entry.email}
                        </a>
                      </td>
                      <td className="py-3">{entry.name || "-"}</td>
                      <td className="py-3">
                        {entry.phone ? (
                          <a
                            href={`tel:${entry.phone}`}
                            className="text-blue-600 hover:underline"
                          >
                            {entry.phone}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3">{entry.claimType || "-"}</td>
                      <td className="py-3 text-sm text-gray-500">
                        {entry.source || "unknown"}
                      </td>
                      <td className="py-3">
                        <Badge className={getStatusColor(entry.status)}>
                          {entry.status}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {entry.submittedCount > 1 ? (
                          <Badge className="bg-orange-100 text-orange-800">
                            High ({entry.submittedCount}x)
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-500">Normal</span>
                        )}
                      </td>
                      <td className="py-3 text-sm text-gray-500">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <select
                          value={entry.status}
                          onChange={(e) =>
                            updateStatus(entry.id, e.target.value)
                          }
                          className="rounded border border-gray-300 px-2 py-1 text-sm"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="CONTACTED">Contacted</option>
                          <option value="CONVERTED">Converted</option>
                          <option value="DECLINED">Declined</option>
                          <option value="INVALID">Invalid</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
