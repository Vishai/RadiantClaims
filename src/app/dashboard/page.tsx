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
import { signOut } from "next-auth/react";

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
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between p-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">RadiantClaims</h1>
            <p className="text-sm text-muted-foreground">Admin Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">{session.user.email}</p>
            <form
              action={async () => {
                "use server";
                await signOut({ redirect: true, redirectTo: "/login" });
              }}
            >
              <Button variant="outline" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Claimants</CardTitle>
            <CardDescription>
              View and manage all claimant submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex gap-4">
              <input
                type="text"
                placeholder="Search by name or email..."
                className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option value="">All States</option>
                <option value="CA">California</option>
                <option value="TX">Texas</option>
                <option value="NY">New York</option>
                <option value="FL">Florida</option>
              </select>
            </div>

            {claimants.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No claimants found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Referral</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claimants.map((claimant) => (
                    <TableRow key={claimant.id}>
                      <TableCell className="font-medium">
                        {claimant.firstName} {claimant.lastName}
                      </TableCell>
                      <TableCell>{claimant.email}</TableCell>
                      <TableCell>{claimant.state}</TableCell>
                      <TableCell>
                        {claimant.referral?.referrerName || "-"}
                      </TableCell>
                      <TableCell>{claimant._count.documents}</TableCell>
                      <TableCell>
                        {new Date(claimant.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/claimants/${claimant.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
