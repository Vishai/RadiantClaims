"use client";

import { ClaimTimelineData, MILESTONE_CONFIGS, DOJMilestone } from "@/lib/claim-timeline/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  Circle,
  Clock,
  TrendingUp,
  Calendar,
  Info,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface ClaimTimelineProps {
  timeline: ClaimTimelineData;
}

export function ClaimTimeline({ timeline }: ClaimTimelineProps) {
  const currentConfig = MILESTONE_CONFIGS[timeline.currentMilestone];
  const completedMilestones = timeline.milestones.filter((m) => !m.isEstimated);
  const futureMilestones = timeline.milestones.filter((m) => m.isEstimated);

  const progressPercentage = calculateProgress(timeline.currentMilestone);

  return (
    <div className="space-y-6">
      {/* Header Card - Current Status */}
      <Card className="rounded-3xl border-2 border-sage-200 bg-gradient-to-br from-sage-50 to-white shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl text-sage-900">
                {currentConfig.label}
              </CardTitle>
              <CardDescription className="mt-2 text-sage-700">
                {currentConfig.description}
              </CardDescription>
            </div>
            {timeline.dojClaimNumber && (
              <div className="rounded-2xl bg-terracotta-100 px-4 py-2">
                <div className="text-xs font-medium text-terracotta-700">
                  DOJ Claim #
                </div>
                <div className="text-sm font-bold text-terracotta-900">
                  {timeline.dojClaimNumber}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-sage-700">Overall Progress</span>
              <span className="font-semibold text-sage-900">{progressPercentage}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-cream-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-terracotta-500 to-terracotta-600 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-cream-50 p-4">
              <div className="flex items-center gap-2 text-sage-600 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">Time in Current Stage</span>
              </div>
              <div className="text-2xl font-bold text-sage-900">
                {timeline.daysInCurrentMilestone} days
              </div>
            </div>

            <div className="rounded-2xl bg-cream-50 p-4">
              <div className="flex items-center gap-2 text-sage-600 mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-medium">Total Processing Time</span>
              </div>
              <div className="text-2xl font-bold text-sage-900">
                {timeline.totalProcessingDays} days
              </div>
            </div>

            {timeline.estimatedCompletionDate && (
              <div className="rounded-2xl bg-gradient-to-br from-terracotta-50 to-peach-50 p-4">
                <div className="flex items-center gap-2 text-terracotta-600 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium">Est. Completion</span>
                </div>
                <div className="text-lg font-bold text-terracotta-900">
                  {format(new Date(timeline.estimatedCompletionDate), "MMM d, yyyy")}
                </div>
                <div className="text-xs text-terracotta-700">
                  ({formatDistanceToNow(new Date(timeline.estimatedCompletionDate))})
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Queue Position */}
      {timeline.queuePosition && (
        <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sage-900">Where Am I In Line?</CardTitle>
            <CardDescription className="text-sage-600">
              Track your progress compared to similar claims
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {timeline.queuePosition.estimatedPosition && timeline.queuePosition.totalInQueue && (
                <div className="rounded-2xl bg-sage-50 p-4">
                  <div className="text-sm text-sage-600 mb-2">Estimated Queue Position</div>
                  <div className="text-3xl font-bold text-sage-900">
                    #{timeline.queuePosition.estimatedPosition}
                    <span className="text-lg font-normal text-sage-600">
                      {" "}of {timeline.queuePosition.totalInQueue}
                    </span>
                  </div>
                </div>
              )}

              {timeline.queuePosition.percentFasterThan && (
                <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4 border-2 border-emerald-200">
                  <div className="text-sm text-emerald-700 mb-2 font-medium">Progress Speed</div>
                  <div className="text-3xl font-bold text-emerald-900">
                    Faster than {timeline.queuePosition.percentFasterThan}%
                  </div>
                  <div className="text-xs text-emerald-700 mt-1">of similar claims</div>
                </div>
              )}

              {timeline.queuePosition.cohortId && (
                <div className="md:col-span-2 rounded-2xl bg-cream-50 p-4">
                  <div className="text-sm text-sage-600 mb-3">
                    Your Cohort: {timeline.queuePosition.cohortId}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-sage-600">Submitted</div>
                      <div className="text-xl font-bold text-sage-900">
                        {timeline.queuePosition.cohortSize}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-sage-600">Approved</div>
                      <div className="text-xl font-bold text-emerald-600">
                        {timeline.queuePosition.cohortApproved}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-sage-600">In Progress</div>
                      <div className="text-xl font-bold text-amber-600">
                        {(timeline.queuePosition.cohortSize || 0) -
                          (timeline.queuePosition.cohortApproved || 0) -
                          (timeline.queuePosition.cohortDenied || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline Events */}
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900">Claim Journey Timeline</CardTitle>
          <CardDescription className="text-sage-600">
            Track every milestone from submission to payout
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative space-y-8 pl-8">
            {/* Vertical timeline line */}
            <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-cream-300" />

            {/* Completed Milestones */}
            {completedMilestones.map((event, index) => {
              const config = MILESTONE_CONFIGS[event.milestone];
              return (
                <TimelineEvent
                  key={`completed-${index}`}
                  config={config}
                  achievedAt={event.achievedAt}
                  daysToAchieve={event.daysToAchieve}
                  notes={event.notes}
                  isCompleted={true}
                  isCurrent={event.milestone === timeline.currentMilestone}
                  isEstimated={false}
                />
              );
            })}

            {/* Future Milestones (Estimated) */}
            {futureMilestones.map((event, index) => {
              const config = MILESTONE_CONFIGS[event.milestone];
              return (
                <TimelineEvent
                  key={`future-${index}`}
                  config={config}
                  achievedAt={event.achievedAt}
                  isCompleted={false}
                  isCurrent={false}
                  isEstimated={true}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Helpful Information */}
      <Card className="rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-sage-700">
              <p className="font-semibold mb-2 text-sage-900">About These Timelines</p>
              <p>
                Timeline estimates are based on historical data from similar claims. Actual
                processing times may vary based on DOJ workload, document completeness, and
                individual case complexity. We'll notify you immediately when your claim reaches
                a new milestone.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface TimelineEventProps {
  config: any;
  achievedAt: Date;
  daysToAchieve?: number;
  notes?: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isEstimated: boolean;
}

function TimelineEvent({
  config,
  achievedAt,
  daysToAchieve,
  notes,
  isCompleted,
  isCurrent,
  isEstimated,
}: TimelineEventProps) {
  return (
    <div className="relative">
      {/* Timeline dot */}
      <div
        className={`absolute -left-8 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
          isCompleted
            ? "border-emerald-500 bg-emerald-500"
            : isCurrent
            ? "border-terracotta-500 bg-white animate-pulse"
            : "border-cream-300 bg-white"
        }`}
      >
        {isCompleted ? (
          <CheckCircle2 className="h-5 w-5 text-white" />
        ) : (
          <Circle className={`h-3 w-3 ${isCurrent ? "text-terracotta-500" : "text-cream-400"}`} />
        )}
      </div>

      {/* Event content */}
      <div
        className={`rounded-2xl p-4 ${
          isCurrent
            ? "bg-gradient-to-br from-terracotta-50 to-peach-50 border-2 border-terracotta-200"
            : isCompleted
            ? "bg-cream-50"
            : "bg-white border border-cream-200"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3
                className={`font-semibold ${
                  isCurrent ? "text-terracotta-900" : "text-sage-900"
                }`}
              >
                {config.label}
              </h3>
              {isEstimated && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Estimated
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-sage-700">{config.description}</p>
            {notes && (
              <p className="mt-2 text-sm text-sage-600 italic">Note: {notes}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-sage-600">
              {isEstimated ? "Expected" : "Completed"}
            </div>
            <div className="text-sm font-medium text-sage-900">
              {format(new Date(achievedAt), "MMM d, yyyy")}
            </div>
            {daysToAchieve !== undefined && (
              <div className="text-xs text-sage-600 mt-1">{daysToAchieve} days</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateProgress(currentMilestone: DOJMilestone): number {
  const milestoneOrder: DOJMilestone[] = [
    "NOT_SUBMITTED",
    "RECEIVED_BY_DOJ",
    "INITIAL_REVIEW",
    "DOCUMENT_VERIFICATION",
    "CANCER_REGISTRY_LOOKUP",
    "ELIGIBILITY_REVIEW",
    "EXPOSURE_VERIFICATION",
    "DISEASE_VERIFICATION",
    "FINAL_REVIEW",
    "APPROVED_PENDING_PAYMENT",
    "PAYMENT_PROCESSING",
    "PAYMENT_ISSUED",
    "CLAIM_APPROVED",
  ];

  const currentIndex = milestoneOrder.indexOf(currentMilestone);
  if (currentIndex === -1) return 0;

  return Math.round((currentIndex / (milestoneOrder.length - 1)) * 100);
}
