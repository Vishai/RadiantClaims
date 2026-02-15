import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type FeedbackRating = "up" | "down";

function getFeedbackRating(metadata: any): FeedbackRating | null {
  const rating = metadata?.feedback?.rating;
  if (rating === "up" || rating === "down") return rating;
  return null;
}

function getFeedbackSource(metadata: any): string {
  const source = metadata?.feedback?.source;
  return typeof source === "string" && source.trim() ? source : "unknown";
}

function normalizePrompt(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 240);
}

export default async function ChatAnalyticsPage({
  searchParams,
}: {
  searchParams: { days?: string };
}) {
  const session = await getServerAuthSession();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const days = Math.min(
    Math.max(parseInt(searchParams.days || "7", 10) || 7, 1),
    30
  );
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [sessionsCount, messagesCount] = await Promise.all([
    db.chatSession.count({ where: { createdAt: { gte: since } } }),
    db.chatMessage.count({ where: { createdAt: { gte: since } } }),
  ]);

  // Pull recent assistant messages with metadata so we can compute feedback.
  // Keep this bounded so we don't blow up server-side render time.
  const assistantMessages = await db.chatMessage.findMany({
    where: {
      createdAt: { gte: since },
      role: "assistant",
      // Can't reliably filter JSON null via Prisma types here; filter in memory below.
    },
    select: {
      id: true,
      sessionId: true,
      content: true,
      metadata: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 2500,
  });

  const feedbackEvents = assistantMessages
    .filter((m) => !!m.metadata)
    .map((m) => ({
      messageId: m.id,
      sessionId: m.sessionId,
      createdAt: m.createdAt,
      rating: getFeedbackRating(m.metadata),
      source: getFeedbackSource(m.metadata),
    }))
    .filter((e) => e.rating);

  const totalsBySource = new Map<
    string,
    { up: number; down: number; total: number }
  >();

  for (const e of feedbackEvents) {
    const key = e.source;
    const curr = totalsBySource.get(key) || { up: 0, down: 0, total: 0 };
    curr.total += 1;
    if (e.rating === "up") curr.up += 1;
    if (e.rating === "down") curr.down += 1;
    totalsBySource.set(key, curr);
  }

  const overall = Array.from(totalsBySource.values()).reduce(
    (acc, s) => {
      acc.up += s.up;
      acc.down += s.down;
      acc.total += s.total;
      return acc;
    },
    { up: 0, down: 0, total: 0 }
  );

  // Build top downvoted prompts by looking up the most recent user message
  // before each downvoted assistant response.
  const downvotes = feedbackEvents
    .filter((e) => e.rating === "down")
    .slice(0, 50);

  const promptCounts = new Map<string, number>();

  for (const dv of downvotes) {
    const prevUser = await db.chatMessage.findFirst({
      where: {
        sessionId: dv.sessionId,
        role: "user",
        createdAt: { lt: dv.createdAt },
      },
      orderBy: { createdAt: "desc" },
      select: { content: true },
    });

    if (!prevUser?.content) continue;
    const key = normalizePrompt(prevUser.content);
    promptCounts.set(key, (promptCounts.get(key) || 0) + 1);
  }

  const topBadPrompts = Array.from(promptCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const sources = Array.from(totalsBySource.entries()).sort(
    (a, b) => b[1].total - a[1].total
  );

  const helpfulRate = overall.total
    ? Math.round((overall.up / overall.total) * 100)
    : null;

  return (
    <div className="min-h-screen bg-cream-50">
      <nav className="border-b border-cream-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between p-6">
          <Link href="/dashboard" className="font-semibold text-sage-900">
            ← Dashboard
          </Link>
          <div className="flex gap-2">
            <Link
              href={{
                pathname: "/dashboard/chat-analytics",
                query: { days: "1" },
              }}
            >
              <Button variant="outline" size="sm">
                24h
              </Button>
            </Link>
            <Link
              href={{
                pathname: "/dashboard/chat-analytics",
                query: { days: "7" },
              }}
            >
              <Button variant="outline" size="sm">
                7d
              </Button>
            </Link>
            <Link
              href={{
                pathname: "/dashboard/chat-analytics",
                query: { days: "30" },
              }}
            >
              <Button variant="outline" size="sm">
                30d
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto space-y-6 p-6">
        <h1 className="text-2xl font-bold text-sage-900">Chat Analytics</h1>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Sessions ({days}d)</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              {sessionsCount}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Messages ({days}d)</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              {messagesCount}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Helpful Rate</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              {helpfulRate === null ? "—" : `${helpfulRate}%`}
            </CardContent>
            <div className="px-6 pb-6 text-sm text-muted-foreground">
              {overall.total} feedback events
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Feedback by Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {sources.length === 0 ? (
              <div className="text-muted-foreground">
                No feedback recorded yet.
              </div>
            ) : (
              sources.map(([source, s]) => {
                const rate = s.total ? Math.round((s.up / s.total) * 100) : 0;
                return (
                  <div
                    key={source}
                    className="flex items-center justify-between rounded-lg border bg-white px-4 py-2"
                  >
                    <div className="font-medium">{source}</div>
                    <div className="text-muted-foreground">
                      {rate}% helpful • 👍 {s.up} • 👎 {s.down} • total{" "}
                      {s.total}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top “Not Helpful” Prompts (sample)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {topBadPrompts.length === 0 ? (
              <div className="text-muted-foreground">
                No downvoted prompts found in the last {days} days.
              </div>
            ) : (
              topBadPrompts.map(([prompt, count]) => (
                <div key={prompt} className="rounded-lg border bg-white p-4">
                  <div className="mb-1 text-muted-foreground">👎 {count}x</div>
                  <div className="whitespace-pre-wrap text-sage-900">
                    {prompt}
                  </div>
                </div>
              ))
            )}
            <div className="text-xs text-muted-foreground">
              Note: This list looks at the most recent user message before each
              downvoted assistant response. It’s a best-effort signal.
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
