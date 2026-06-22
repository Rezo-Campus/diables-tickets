import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase, type AppRole } from "@/lib/supabase";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Admin · Utilisateurs — Diables Rouges" }] }),
  component: AdminUsersPage,
});

type AdminUserRow = {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  roles: AppRole[];
};

function AdminUsersPage() {
  const { loading, rolesLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUserRow[] | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !rolesLoading && !isAdmin) navigate({ to: "/" });
  }, [loading, rolesLoading, isAdmin, navigate]);

  function load() {
    supabase.rpc("admin_list_users").then(({ data, error }) => {
      if (error) toast.error(error.message);
      setUsers((data as AdminUserRow[]) ?? []);
    });
  }

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  async function toggleRole(u: AdminUserRow, role: AppRole, enabled: boolean) {
    setUpdating(`${u.id}-${role}`);
    const { error } = enabled
      ? await supabase.rpc("admin_grant_role", { p_user_id: u.id, p_role: role })
      : await supabase.rpc("admin_revoke_role", { p_user_id: u.id, p_role: role });
    setUpdating(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setUsers(
      (prev) =>
        prev?.map((u2) =>
          u2.id === u.id
            ? { ...u2, roles: enabled ? [...u2.roles, role] : u2.roles.filter((r) => r !== role) }
            : u2,
        ) ?? null,
    );
  }

  if (loading || rolesLoading || !isAdmin)
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-2 text-3xl font-black tracking-tight">Utilisateurs</h1>
      <p className="mb-6 text-muted-foreground">
        Attribuez le rôle commercial (accès au scan) ou admin (scan + gestion des matchs).
      </p>

      {users === null ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Rôles</TableHead>
                <TableHead className="text-center">Commercial</TableHead>
                <TableHead className="text-center">Admin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.email}</TableCell>
                  <TableCell className="text-muted-foreground">{u.full_name || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {u.roles.map((r) => (
                        <Badge key={r} variant="secondary">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={u.roles.includes("commercial")}
                      disabled={updating === `${u.id}-commercial`}
                      onCheckedChange={(v) => toggleRole(u, "commercial", v)}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={u.roles.includes("admin")}
                      disabled={updating === `${u.id}-admin`}
                      onCheckedChange={(v) => toggleRole(u, "admin", v)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
