"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ClaimantWorkflowStatus,
  ClaimType,
  ServiceTier,
  SubscriptionStatus,
} from "@prisma/client";
import { ClaimantDetailModal } from "@/components/attorney/claimant-detail-modal";
import { WorkflowStatusBadge } from "@/components/attorney/workflow-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Filter,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  MapPin,
  DollarSign,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Claimant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  county: string;
  createdAt: string;
  updatedAt: string;
  workflowStatus: ClaimantWorkflowStatus;
  assignedAt?: string;
  documentCount: number;
  hasCompletedIntake: boolean;
  claimType?: ClaimType | null;
  isPremiumService: boolean;
  subscription: {
    tier: ServiceTier;
    status: SubscriptionStatus;
    setupFeePaid: boolean;
    setupFeeWaived: boolean;
    isComplimentary: boolean;
    complimentaryReason?: string | null;
    promoCode?: string | null;
  } | null;
}

interface ApiResponse {
  claimants: Claimant[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  user: {
    id: string;
    role: string;
    firmId?: string | null;
  };
}

const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  PANCREATIC_CANCER: "Pancreatic Cancer",
  THYROID_CANCER: "Thyroid Cancer",
  KIDNEY_CANCER: "Kidney Cancer",
  LUNG_CANCER: "Lung Cancer",
  BRAIN_CANCER: "Brain Cancer",
  OTHER_CANCER: "Other Cancer",
  NON_CANCER: "Non-Cancer",
  DOWNWINDER: "Downwinder",
  URANIUM_WORKER: "Uranium Worker",
  MANHATTAN_PROJECT_WASTE: "Manhattan Project Waste",
  ONSITE_PARTICIPANT: "Onsite Participant",
};

export default function AttorneyDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [claimants, setClaimants] = useState<Claimant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClaimant, setSelectedClaimant] = useState<Claimant | null>(
    null
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page] = useState(1); // TODO: Add pagination controls

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    needsReview: 0,
    approved: 0,
    revisionRequested: 0,
  });

  // Redirect if not authenticated or not attorney
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login?callbackUrl=/attorney/dashboard");
      return;
    }

    if (
      session.user.role !== "ATTORNEY" &&
      session.user.role !== "FIRM_ADMIN"
    ) {
      router.push("/dashboard");
      return;
    }
  }, [session, status, router]);

  // Fetch claimants
  useEffect(() => {
    if (status === "loading" || !session) return;

    let isActive = true;

    const loadClaimants = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: "50", // Show more in table view
        });

        if (searchQuery) {
          params.append("search", searchQuery);
        }

        if (statusFilter && statusFilter !== "all") {
          params.append("status", statusFilter);
        }

        const response = await fetch(`/api/attorney/claimants?${params}`);

        if (!response.ok) {
          throw new Error("Failed to fetch claimants");
        }

        const data: ApiResponse = await response.json();

        if (!isActive) return;

        setClaimants(data.claimants);

        const needsReview = data.claimants.filter(
          (c) =>
            c.workflowStatus === "READY_FOR_ATTORNEY" ||
            c.workflowStatus === "ATTORNEY_REVIEWING"
        ).length;
        const approved = data.claimants.filter(
          (c) => c.workflowStatus === "ATTORNEY_APPROVED"
        ).length;
        const revisionRequested = data.claimants.filter(
          (c) => c.workflowStatus === "REVISION_REQUESTED"
        ).length;

        setStats({
          total: data.pagination.total,
          needsReview,
          approved,
          revisionRequested,
        });
      } catch (err) {
        if (!isActive) return;

        console.error("Failed to fetch claimants:", err);
        setError("Failed to load claimants. Please try again.");
      } finally {
        if (!isActive) return;

        setLoading(false);
      }
    };

    loadClaimants();

    return () => {
      isActive = false;
    };
  }, [page, searchQuery, statusFilter, session, status]);

  // Show loading state during authentication check
  if (status === "loading" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="text-center">
          <Clock className="mx-auto h-12 w-12 animate-spin text-sage-600" />
          <p className="mt-4 text-sage-700">Loading...</p>
        </div>
      </div>
    );
  }

  // Check permissions
  if (session.user.role !== "ATTORNEY" && session.user.role !== "FIRM_ADMIN") {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <header className="border-b border-cream-200 bg-white">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-sage-900">
                Attorney Portal
              </h1>
              <p className="mt-1 text-sage-600">
                Review and approve RECA claim packets
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-sage-600">
                {session.user.name || session.user.email}
              </span>
              <Button
                variant="outline"
                onClick={() => router.push("/api/auth/signout")}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="border-b border-cream-200 bg-white">
        <div className="container mx-auto px-6 py-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="flex items-center gap-4 rounded-lg border border-sage-200 bg-sage-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-600">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-sage-900">
                  {stats.total}
                </p>
                <p className="text-sm text-sage-600">Total Claimants</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg border border-purple-200 bg-purple-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900">
                  {stats.needsReview}
                </p>
                <p className="text-sm text-purple-600">Needs Review</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-900">
                  {stats.approved}
                </p>
                <p className="text-sm text-emerald-600">Approved</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-600">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-900">
                  {stats.revisionRequested}
                </p>
                <p className="text-sm text-orange-600">Revision Requested</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-500" />
              <Input
                type="text"
                placeholder="Search by name, email, or state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="READY_FOR_ATTORNEY">
                  Ready for Review
                </SelectItem>
                <SelectItem value="ATTORNEY_REVIEWING">Under Review</SelectItem>
                <SelectItem value="REVISION_REQUESTED">
                  Revision Requested
                </SelectItem>
                <SelectItem value="ATTORNEY_APPROVED">Approved</SelectItem>
                <SelectItem value="PACKET_PRINTED">Packet Printed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Data Table */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Clock className="h-8 w-8 animate-spin text-sage-600" />
          </div>
        ) : claimants.length === 0 ? (
          <div className="rounded-lg border border-cream-200 bg-white p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-sage-400" />
            <h3 className="mt-4 text-lg font-semibold text-sage-900">
              No claimants found
            </h3>
            <p className="mt-2 text-sage-600">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "No claimants have been assigned to your firm yet"}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-cream-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Claim Type</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claimants.map((claimant) => {
                  const needsAttention =
                    claimant.workflowStatus === "READY_FOR_ATTORNEY" ||
                    claimant.workflowStatus === "REVISION_REQUESTED";

                  return (
                    <TableRow
                      key={claimant.id}
                      className={`cursor-pointer hover:bg-sage-50 ${
                        needsAttention ? "bg-purple-50/50" : ""
                      }`}
                      onClick={() => setSelectedClaimant(claimant)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-semibold text-sage-900">
                              {claimant.firstName} {claimant.lastName}
                            </div>
                            <div className="text-sm text-sage-600">
                              {claimant.email}
                            </div>
                          </div>
                          {claimant.isPremiumService && (
                            <span title="Premium Service">
                              <DollarSign className="h-4 w-4 text-amber-600" />
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sage-700">
                          <MapPin className="h-4 w-4 text-sage-500" />
                          {claimant.county}, {claimant.state}
                        </div>
                      </TableCell>
                      <TableCell>
                        {claimant.claimType ? (
                          <span className="text-sage-700">
                            {CLAIM_TYPE_LABELS[claimant.claimType]}
                          </span>
                        ) : (
                          <span className="text-sage-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sage-700">
                          <FileText className="h-4 w-4 text-sage-500" />
                          {claimant.documentCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <WorkflowStatusBadge
                          status={claimant.workflowStatus}
                          size="sm"
                          showIcon={false}
                        />
                      </TableCell>
                      <TableCell className="text-sage-600">
                        {formatDistanceToNow(new Date(claimant.updatedAt), {
                          addSuffix: true,
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Show result count */}
        {!loading && claimants.length > 0 && (
          <div className="mt-4 text-center text-sm text-sage-600">
            Showing {claimants.length} of {stats.total} claimants
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedClaimant && (
        <ClaimantDetailModal
          open={!!selectedClaimant}
          onOpenChange={(open) => !open && setSelectedClaimant(null)}
          claimant={selectedClaimant}
        />
      )}
    </div>
  );
}
