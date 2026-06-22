import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase, type Competition } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/competitions")({
  head: () => ({ meta: [{ title: "Admin · Compétitions — Diables Rouges" }] }),
  component: AdminCompetitionsPage,
});

function AdminCompetitionsPage() {
  const { loading, rolesLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [comps, setComps] = useState<Competition[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Competition | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !rolesLoading && !isAdmin) navigate({ to: "/" });
  }, [loading, rolesLoading, isAdmin, navigate]);

  function load() {
    supabase
      .from("competitions")
      .select("*")
      .order("name")
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setComps(data ?? []);
      });
  }

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(c: Competition) {
    setEditing(c);
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name")),
      slug: String(fd.get("slug")),
      description: String(fd.get("description") || "") || null,
    };
    setSaving(true);
    const { error } = editing
      ? await supabase.from("competitions").update(payload).eq("id", editing.id)
      : await supabase.from("competitions").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Compétition modifiée" : "Compétition créée");
    setFormOpen(false);
    load();
  }

  async function handleDelete(c: Competition) {
    if (!window.confirm(`Supprimer la compétition "${c.name}" ? Cette action est irréversible.`))
      return;
    const { error } = await supabase.from("competitions").delete().eq("id", c.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Compétition supprimée");
      load();
    }
  }

  if (loading || rolesLoading || !isAdmin)
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight">Compétitions</h1>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Nouvelle compétition
        </Button>
      </div>

      {comps === null ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {comps.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.slug}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {c.description}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(c)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier la compétition" : "Nouvelle compétition"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Mettez à jour les informations."
                : "Renseignez les informations de la compétition."}
            </DialogDescription>
          </DialogHeader>
          <form key={editing?.id ?? "new"} onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input id="name" name="name" defaultValue={editing?.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" defaultValue={editing?.slug} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editing?.description ?? ""}
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Enregistrer" : "Créer"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
