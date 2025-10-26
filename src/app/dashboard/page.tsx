import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Heart } from "lucide-react";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { search?: string; state?: string };
}) {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/login");
  }

  const where = {
    AND: [
      searchParams.search
        ? {
            OR: [
              {
                firstName: {
                  contains: searchParams.search,
                  mode: "insensitive" as const,
                },
              },
              {
                lastName: {
                  contains: searchParams.search,
                  mode: "insensitive" as const,
                },
              },
              {
                email: {
                  contains: searchParams.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {},
      searchParams.state ? { state: searchParams.state } : {},
    ],
  };

  const claimants = await db.claimant.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      referral: true,
      _count: {
        select: { documents: true },
      },
    },
  });

  return (
    <div className="min-h-screen bg-cream-50">
      <nav className="border-b border-cream-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta-500">
              <Heart className="h-5 w-5 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-sage-800">RadiantClaims</h1>
              <p className="text-xs text-sage-600">Admin Dashboard</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <p className="text-sm text-sage-600">{session.user.email}</p>
            <form
              action={async () => {
                "use server";
                const { signOut } = await import("next-auth/react");
                await signOut({ redirect: true, redirectTo: "/login" });
              }}
            >
              <Button variant="outline" type="submit" className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-sage-900">Claimants</h2>
          <p className="text-sage-600">View and manage all claimant submissions</p>
          <div className="mt-2 h-1 w-24 rounded-full bg-terracotta-400"></div>
        </div>

        <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sage-900">All Submissions</CardTitle>
            <CardDescription className="text-sage-600">
              Search and filter claimant records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex gap-4">
              <input
                type="text"
                placeholder="Search by name or email..."
                className="flex h-10 flex-1 rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm text-sage-900 placeholder:text-sage-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400 focus-visible:ring-offset-2"
              />
              <select className="h-10 rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm text-sage-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400 focus-visible:ring-offset-2">
                <option value="">All States</option>
                <option value="CA">California</option>
                <option value="TX">Texas</option>
                <option value="NY">New York</option>
                <option value="FL">Florida</option>
              </select>
            </div>

            {claimants.length === 0 ? (
              <div className="py-12 text-center text-sage-600">
                No claimants found
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-cream-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-sage-50 to-cream-50 hover:from-sage-50 hover:to-cream-50">
                      <TableHead className="text-sage-900">Name</TableHead>
                      <TableHead className="text-sage-900">Email</TableHead>
                      <TableHead className="text-sage-900">State</TableHead>
                      <TableHead className="text-sage-900">Referral</TableHead>
                      <TableHead className="text-sage-900">Documents</TableHead>
                      <TableHead className="text-sage-900">Created</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claimants.map((claimant) => (
                      <TableRow key={claimant.id} className="hover:bg-cream-50">
                        <TableCell className="font-medium text-sage-900">
                          {claimant.firstName} {claimant.lastName}
                        </TableCell>
                        <TableCell className="text-sage-700">{claimant.email}</TableCell>
                        <TableCell className="text-sage-700">{claimant.state}</TableCell>
                        <TableCell className="text-sage-700">
                          {claimant.referral?.referrerName || "-"}
                        </TableCell>
                        <TableCell className="text-sage-700">
                          <span className="inline-flex items-center rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-medium text-sage-800">
                            {claimant._count.documents}
                          </span>
                        </TableCell>
                        <TableCell className="text-sage-700">
                          {new Date(claimant.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Link href={`/dashboard/claimants/${claimant.id}`}>
                            <Button variant="ghost" size="sm" className="text-terracotta-600 hover:bg-terracotta-50 hover:text-terracotta-700">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
