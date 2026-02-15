"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Collaborator = {
  id: string;
  role: string;
  acceptedAt: string;
  user: { id: string; email: string | null; name: string | null };
};

type Invite = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  expiresAt: string;
};

export function ManageCollaboratorsDialog({
  open,
  onOpenChange,
  intakeSessionId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intakeSessionId: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);

  const load = async () => {
    if (!intakeSessionId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/portal/collaborators/list?intakeSessionId=${intakeSessionId}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setCollaborators(data.collaborators || []);
      setInvites(data.invites || []);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to load collaborators");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, intakeSessionId]);

  const revoke = async (userId: string) => {
    if (!intakeSessionId) return;
    if (!confirm("Remove this collaborator’s access?")) return;

    try {
      const res = await fetch("/api/portal/collaborators/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intakeSessionId, collaboratorUserId: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to revoke");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to revoke");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Manage family access</DialogTitle>
          <DialogDescription>
            Family members can view this claim, upload documents, and leave
            notes. They cannot edit your answers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-sage-900">
              Active collaborators
            </h3>
            {loading ? (
              <p className="text-sm text-sage-600">Loading…</p>
            ) : collaborators.length === 0 ? (
              <p className="text-sm text-sage-600">None yet.</p>
            ) : (
              <ul className="space-y-2">
                {collaborators.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-xl border border-cream-200 bg-white p-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-sage-900">
                        {c.user.name || c.user.email || "User"}
                      </div>
                      <div className="text-xs text-sage-600">
                        {c.user.email} • {c.role}
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => revoke(c.user.id)}>
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-sage-900">
              Pending invites
            </h3>
            {loading ? (
              <p className="text-sm text-sage-600">Loading…</p>
            ) : invites.length === 0 ? (
              <p className="text-sm text-sage-600">No pending invites.</p>
            ) : (
              <ul className="space-y-2">
                {invites.map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center justify-between rounded-xl border border-cream-200 bg-white p-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-sage-900">
                        {i.name || i.email}
                      </div>
                      <div className="text-xs text-sage-600">
                        Expires {new Date(i.expiresAt).toLocaleDateString()} •
                        {i.role}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
