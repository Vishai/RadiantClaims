import { AlertTriangle, Calendar, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { generateDailyPost } from "@/lib/daily-post/generate";
import { CopyButton } from "./CopyButton";

/**
 * /admin/daily-post — Generates today's Daily DOJ Status post draft
 * using live data from the `dOJDailyStats` table. Admin-only, gated
 * by the `/admin` layout's role check.
 *
 * Workflow: open this page at ~7:10am MT (just after the scrape cron
 * runs at 7:00am MT), hit "Copy to clipboard", paste into Meta
 * Business Suite.
 *
 * Day-of-week aware: Mondays get the weekly-reset template, Wednesdays
 * get the mid-week-insight template, Fridays get the weekly summary,
 * and all other days get the standard daily update.
 */

export const dynamic = "force-dynamic";

export default async function DailyPostPage() {
  const result = await generateDailyPost(new Date());
  const dateLabel = result.referenceDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Denver",
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
      <Card className="border-2 border-cream-200">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-sage-900">
                <FileText className="h-5 w-5" />
                Daily DOJ Post Draft
              </CardTitle>
              <CardDescription className="flex items-center gap-2 pt-1 text-sage-600">
                <Calendar className="h-4 w-4" />
                {dateLabel} · {templateLabel(result.template)}
              </CardDescription>
            </div>
            <CopyButton text={result.text} />
          </div>
        </CardHeader>

        <CardContent>
          {result.warnings.length > 0 && (
            <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <div className="mb-1 flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4" />
                Data warnings
              </div>
              <ul className="list-inside list-disc space-y-1">
                {result.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-amber-800">
                Review the draft and replace any <code>[DATA PENDING]</code>{" "}
                markers manually before posting.
              </p>
            </div>
          )}

          <pre className="whitespace-pre-wrap rounded-xl border border-cream-200 bg-cream-50/40 p-4 font-sans text-sm leading-relaxed text-sage-900">
            {result.text}
          </pre>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-sage-600">
            <span>
              {result.text.length} characters ·{" "}
              {result.text.split(/\s+/).filter(Boolean).length} words
            </span>
            <span>Generator: day-of-week {result.template}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-cream-200 bg-cream-50/40">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-sage-800">
            Posting checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-sage-700">
          <div>✓ Copy the post above</div>
          <div>✓ Open Meta Business Suite → Create Post</div>
          <div>✓ Paste, verify no [DATA PENDING] markers remain</div>
          <div>✓ Publish to Facebook Page (consider cross-posting to IG)</div>
          <div>
            ✓ In the comments, post the eligibility URL as the first reply:{" "}
            <code className="rounded bg-white px-1 py-0.5">
              🔗 Free eligibility check: https://radiantclaims.com/eligibility
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function templateLabel(template: string): string {
  switch (template) {
    case "monday":
      return "Weekly reset template";
    case "wednesday":
      return "Midweek insight template";
    case "friday":
      return "Weekly summary template";
    default:
      return "Standard daily template";
  }
}
