"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Eye, UserCog, Mail, Shield } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  emailVerified: Date | null;
  createdAt: string;
  mfaEnabled: boolean;
  passwordResetRequired: boolean;
  _count: {
    claimants: number;
  };
  serviceSubscription: {
    tier: string;
    status: string;
  } | null;
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/users");

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filterUsers = useCallback(() => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(term) ||
          user.name?.toLowerCase().includes(term)
      );
    }

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const viewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const resetPassword = async (userId: string) => {
    if (!confirm("Send password reset email to this user?")) return;

    try {
      const response = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reset email");
      }

      alert("Password reset email sent successfully");
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("Failed to send password reset email");
    }
  };

  const toggleUserRole = async (userId: string, newRole: string) => {
    if (!confirm(`Change user role to ${newRole}?`)) return;

    try {
      const response = await fetch("/api/admin/users/update-role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user role");
      }

      fetchUsers();
      alert("User role updated successfully");
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Failed to update user role");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "STAFF_REVIEWER":
        return "bg-purple-100 text-purple-800";
      case "SENIOR_REVIEWER":
        return "bg-blue-100 text-blue-800";
      case "ATTORNEY":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSubscriptionBadge = (subscription: User["serviceSubscription"]) => {
    if (!subscription)
      return <Badge className="bg-gray-100 text-gray-800">None</Badge>;

    const tierLabel = subscription.tier === "DIY_PREP" ? "DIY" : "Legal";
    const color =
      subscription.tier === "DIY_PREP"
        ? "bg-purple-100 text-purple-800"
        : "bg-blue-100 text-blue-800";

    return <Badge className={color}>{tierLabel}</Badge>;
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-gray-600">View and manage all system users</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-sm text-gray-600">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {users.filter((u) => u.role === "CUSTOMER").length}
            </div>
            <p className="text-sm text-gray-600">Customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {users.filter((u) => u.role === "ADMIN").length}
            </div>
            <p className="text-sm text-gray-600">Admins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {
                users.filter((u) => u.serviceSubscription?.status === "ACTIVE")
                  .length
              }
            </div>
            <p className="text-sm text-gray-600">Active Subscriptions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="STAFF_REVIEWER">Staff Reviewer</SelectItem>
                  <SelectItem value="SENIOR_REVIEWER">
                    Senior Reviewer
                  </SelectItem>
                  <SelectItem value="ATTORNEY">Attorney</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            {filteredUsers.length}{" "}
            {roleFilter !== "all" ? roleFilter.toLowerCase() : ""} users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Loading...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Subscription</th>
                    <th className="pb-3 font-medium">Claims</th>
                    <th className="pb-3 font-medium">MFA</th>
                    <th className="pb-3 font-medium">Joined</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="font-medium">{user.name || "—"}</div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{user.email}</span>
                          {!user.emailVerified && (
                            <Badge className="bg-yellow-100 text-xs text-yellow-800">
                              Unverified
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {getSubscriptionBadge(user.serviceSubscription)}
                      </td>
                      <td className="py-3 text-center">
                        <Badge className="bg-gray-100 text-gray-800">
                          {user._count.claimants}
                        </Badge>
                      </td>
                      <td className="py-3 text-center">
                        {user.mfaEnabled ? (
                          <Shield className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewUser(user)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resetPassword(user.id)}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>User Details</DialogTitle>
                <DialogDescription>
                  Viewing details for {selectedUser.email}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-base">{selectedUser.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-base">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Role</p>
                    <Badge className={getRoleBadgeColor(selectedUser.role)}>
                      {selectedUser.role}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Subscription
                    </p>
                    {getSubscriptionBadge(selectedUser.serviceSubscription)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Email Verified
                    </p>
                    <p className="text-base">
                      {selectedUser.emailVerified ? "Yes" : "No"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      MFA Enabled
                    </p>
                    <p className="text-base">
                      {selectedUser.mfaEnabled ? "Yes" : "No"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Claims
                    </p>
                    <p className="text-base">{selectedUser._count.claimants}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Joined Date
                    </p>
                    <p className="text-base">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="mb-3 text-sm font-medium text-gray-500">
                    Admin Actions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resetPassword(selectedUser.id)}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Send Password Reset
                    </Button>
                    {selectedUser.role !== "ADMIN" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleUserRole(selectedUser.id, "ADMIN")}
                      >
                        <UserCog className="mr-2 h-4 w-4" />
                        Make Admin
                      </Button>
                    )}
                    {selectedUser.role === "ADMIN" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          toggleUserRole(selectedUser.id, "CUSTOMER")
                        }
                      >
                        <UserCog className="mr-2 h-4 w-4" />
                        Remove Admin
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
