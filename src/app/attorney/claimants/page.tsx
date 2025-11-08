"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ClaimantWorkflowStatus,
  ClaimType,
  ServiceTier,
  SubscriptionStatus,
} from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Filter, FolderOpen, Search, ShieldCheck, Users } from "lucide-react";

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
  subscription: SubscriptionSummary | null;
}

interface SubscriptionSummary {
  tier: ServiceTier;
  status: SubscriptionStatus;
  setupFeePaid: boolean;
  setupFeePaidAt?: string | null;
  setupFeeWaived: boolean;
  setupFeeAmount?: number | null;
  monthlyFeeAmount?: number | null;
  discountPercent?: number | null;
  discountAmount?: number | null;
  isPilotAccount: boolean;
  promoCode?: string | null;
  promoName?: string | null;
  promoCampaign?: string | null;
  complimentaryReason?: string | null;
  isComplimentary: boolean;
}

const WORKFLOW_BUCKETS: {
  value: string;
  label: string;
  description: string;
  statuses: ClaimantWorkflowStatus[];
}[] = [
  {
    value: "ready",
    label: "Ready for Review",
    description: "Sessions needing immediate attorney review",
    statuses: ["READY_FOR_ATTORNEY"],
  },
  {
    value: "reviewing",
    label: "In Attorney Review",
    description: "Currently being reviewed by your team",
    statuses: ["ATTORNEY_REVIEWING"],
  },
  {
    value: "changes",
    label: "Needs Revisions",
    description: "Waiting on claimant updates / revisions",
    statuses: ["REVISION_REQUESTED"],
  },
  {
    value: "approved",
    label: "Approved & Beyond",
    description: "Approved packets through DOJ decision",
    statuses: [
      "ATTORNEY_APPROVED",
      "PACKET_PRINTED",
      "MAILING_READY",
      "CLIENT_MAILED",
      "DOJ_SUBMITTED",
      "DOJ_PROCESSING",
      "APPROVED",
    ],
  },
  {
    value: "intake",
    label: "Early Pipeline",
    description: "Intake & document preparation in progress",
    statuses: ["INTAKE", "DOCUMENTS_PENDING", "INTERNAL_REVIEW"],
  },
];

const DEFAULT_WORKFLOW_BUCKET = WORKFLOW_BUCKETS[0]?.value ?? "ready";

const WORKFLOW_LABELS: Record<ClaimantWorkflowStatus, string> = {
  INTAKE: "Intake In Progress",
  DOCUMENTS_PENDING: "Documents Pending",
  INTERNAL_REVIEW: "Internal Review",
  READY_FOR_ATTORNEY: "Ready for Attorney",
  ATTORNEY_REVIEWING: "Attorney Reviewing",
  REVISION_REQUESTED: "Revision Requested",
  ATTORNEY_APPROVED: "Attorney Approved",
  PACKET_PRINTED: "Packet Printed",
  MAILING_READY: "Ready for Mailing",
  CLIENT_MAILED: "Client Confirmed Mailing",
  DOJ_SUBMITTED: "Submitted to DOJ",
  DOJ_PROCESSING: "DOJ Processing",
  APPROVED: "Approved by DOJ",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

const TIER_LABELS: Record<ServiceTier, string> = {
  DIY_PREP: "DIY Preparation",
  LEGAL_REP: "Legal Representation",
};

export default function AttorneyClaimantsWorkflowPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [claimants, setClaimants] = useState<Claimant[]>([]);
  const [activeTab, setActiveTab] = useState(DEFAULT_WORKFLOW_BUCKET);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/login?callbackUrl=/attorney/claimants");
      return;
    }

    if (
      session.user.role !== "ATTORNEY" &&
      session.user.role !== "FIRM_ADMIN"
    ) {
      router.push("/portal");
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    if (status === "loading" || !session?.user) return;

    const fetchClaimants = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/attorney/claimants?limit=200");
        if (!response.ok) {
          throw new Error("Failed to load claimants");
        }
        const data = await response.json();
        setClaimants(data.claimants);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Failed to load claimants"
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchClaimants();
  }, [session, status]);

  const filteredClaimants = useMemo(() => {
    if (!searchQuery) return claimants;
    const value = searchQuery.toLowerCase();
    return claimants.filter(
      (c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(value) ||
        c.email.toLowerCase().includes(value) ||
        c.state.toLowerCase().includes(value) ||
        (c.subscription?.promoCode || "").toLowerCase().includes(value)
    );
  }, [claimants, searchQuery]);

  const complimentaryCount = useMemo(
    () =>
      filteredClaimants.filter((c) => c.subscription?.isComplimentary).length,
    [filteredClaimants]
  );

  const renderClaimantCard = (claimant: Claimant) => {
    const workflowLabel =
      WORKFLOW_LABELS[claimant.workflowStatus] || claimant.workflowStatus;
    const updatedAt = formatDistanceToNow(new Date(claimant.updatedAt), {
      addSuffix: true,
    });
    const subscription = claimant.subscription;
    const promoBadge =
      subscription?.isComplimentary && subscription.complimentaryReason
        ? subscription.complimentaryReason
        : null;

    return (
      <Card key={claimant.id} className="hover:border-sage-300">
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-900">
                  {claimant.firstName} {claimant.lastName}
                </h3>
                <Badge variant="secondary">{workflowLabel}</Badge>
              </div>
              <p className="text-sm text-slate-500">
                {claimant.email} · {claimant.state}
              </p>
              <p className="text-xs text-slate-400">
                Updated {updatedAt} • Documents uploaded:{" "}
                {claimant.documentCount}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <Badge variant="outline">
                {subscription
                  ? TIER_LABELS[subscription.tier]
                  : "No subscription"}
              </Badge>
              {subscription?.status === "CANCELED" && (
                <Badge variant="destructive">Canceled</Badge>
              )}
              {promoBadge && (
                <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
                  {promoBadge}
                </Badge>
              )}
            </div>
          </div>

          {subscription && (
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="font-medium text-slate-900">Billing</span>
                <span>
                  Tier: <strong>{TIER_LABELS[subscription.tier]}</strong>
                </span>
                <span>
                  Setup fee:{" "}
                  {subscription.setupFeePaid
                    ? "Paid"
                    : subscription.setupFeeWaived
                      ? "Waived"
                      : "Pending"}
                </span>
                {subscription.promoCode && (
                  <span>
                    Promo: <strong>{subscription.promoCode}</strong>
                  </span>
                )}
                {subscription.isComplimentary && (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <ShieldCheck className="h-4 w-4" />
                    Complimentary service
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/attorney/claimants/${claimant.id}`}>
                View details
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/portal/documents?claimantId=${claimant.id}`}>
                Documents
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTabContent = (bucketValue: string) => {
    const bucket = WORKFLOW_BUCKETS.find((b) => b.value === bucketValue);
    if (!bucket) return null;

    const bucketClaimants = filteredClaimants.filter((c) =>
      bucket.statuses.includes(c.workflowStatus)
    );

    if (bucketClaimants.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <FolderOpen className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-500">
              No claimants in this workflow yet.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {bucketClaimants.map((claimant) => renderClaimantCard(claimant))}
      </div>
    );
  };

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-slate-600">Loading claimants…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="space-y-4 p-6 text-center">
            <p className="text-base font-semibold text-red-600">
              Unable to load claimants
            </p>
            <p className="text-sm text-slate-600">{error}</p>
            <Button onClick={() => router.refresh()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Claimant Pipeline
          </h1>
          <p className="text-slate-600">
            Track assignments by workflow stage and see which clients are
            receiving complimentary service.
          </p>
        </div>
        <div className="flex gap-2 text-sm text-slate-500">
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2">
            <Users className="h-4 w-4 text-slate-400" />
            <span>{claimants.length} total</span>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            <span>{complimentaryCount} complimentary</span>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, state, or promo code"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Filter className="h-4 w-4" />
            <span>Filter by workflow</span>
          </div>
        </CardContent>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="flex w-full flex-wrap justify-start gap-2 bg-transparent p-0">
          {WORKFLOW_BUCKETS.map((bucket) => {
            const count = filteredClaimants.filter((c) =>
              bucket.statuses.includes(c.workflowStatus)
            ).length;
            const isActive = activeTab === bucket.value;
            return (
              <TabsTrigger
                key={bucket.value}
                value={bucket.value}
                className={`flex flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left text-sm shadow-sm transition-all ${
                  isActive
                    ? "border-sage-600 bg-sage-50 text-sage-900"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                <span className="font-semibold">{bucket.label}</span>
                <span className="text-xs text-slate-500">
                  {bucket.description}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {count} active
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {WORKFLOW_BUCKETS.map((bucket) => (
          <TabsContent key={bucket.value} value={bucket.value}>
            {renderTabContent(bucket.value)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
