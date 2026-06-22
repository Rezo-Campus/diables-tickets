import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase, type Competition, type Match } from "@/lib/supabase";
import { TeamSide } from "@/components/TeamSide";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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

export const Route = createFileRoute("/admin/matches")({
  head: () => ({ meta: [{ title: "Admin · Matchs — Diables Rouges" }] }),
  component: AdminMatchesPage,
});

type MatchRow = Match & { competitions: { name: string } | null };

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AdminMatchesPage() {
  const { loading, rolesLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [comps, setComps] = useState<Competition[]>([]);
  const [matches, setMatches] = useState<MatchRow[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Match | null>(null);
  const [competitionId, setCompetitionId] = useState<string>("");
  const [isHome, setIsHome] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !rolesLoading && !isAdmin) navigate({ to: "/" });
  }, [loading, rolesLoading, isAdmin, navigate]);

  function load() {
    supabase
      .from("matches")
      .select("*, competitions(name)")
      .order("match_date", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setMatches((data as MatchRow[] | null) ?? []);
      });
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
    setCompetitionId(comps[0]?.id ?? "");
    setIsHome(true);
    setFormOpen(true);
  }

  function openEdit(m: Match) {
    setEditing(m);
    setCompetitionId(m.competition_id);
    setIsHome(m.is_home);
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!competitionId) {
      toast.error("Choisissez une compétition");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const payload = {
      competition_id: competitionId,
      opponent: String(fd.get("opponent")),
      venue: String(fd.get("venue") || "") || null,
      opponent_country_code: String(fd.get("opponent_country_code") || "").toUpperCase() || null,
      match_date: new Date(String(fd.get("match_date"))).toISOString(),
      ticket_price: Number(fd.get("ticket_price")),
      tickets_available: Number(fd.get("tickets_available")),
      is_home: isHome,
    };
    setSaving(true);
    const { error } = editing
      ? await supabase.from("matches").update(payload).eq("id", editing.id)
      : await supabase.from("matches").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Match modifié" : "Match créé");
    setFormOpen(false);
    load();
  }

  async function handleDelete(m: Match) {
    if (
      !window.confirm(`Supprimer le match contre "${m.opponent}" ? Cette action est irréversible.`)
    )
      return;
    const { error } = await supabase.from("matches").delete().eq("id", m.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Match supprimé");
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
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight">Matchs</h1>
        <Button onClick={openCreate} disabled={comps.length === 0} className="gap-2">
          <Plus className="h-4 w-4" /> Nouveau match
        </Button>
      </div>
      {comps.length === 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          Créez d'abord une compétition avant d'ajouter un match.
        </p>
      )}

      {matches === null ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Compétition</TableHead>
                <TableHead>Adversaire</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Lieu</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Places</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.competitions?.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <TeamSide
                        showHomeTeam={m.is_home}
                        opponent={m.opponent}
                        opponentCountryCode={m.opponent_country_code}
                      />
                      <span className="text-muted-foreground">vs</span>
                      <TeamSide
                        showHomeTeam={!m.is_home}
                        opponent={m.opponent}
                        opponentCountryCode={m.opponent_country_code}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(m.match_date).toLocaleString("fr-FR")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.venue}</TableCell>
                  <TableCell>{m.ticket_price.toLocaleString("fr-FR")} FCFA</TableCell>
                  <TableCell>{m.tickets_available}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(m)}>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le match" : "Nouveau match"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Mettez à jour les informations."
                : "Renseignez les informations du match."}
            </DialogDescription>
          </DialogHeader>
          <form key={editing?.id ?? "new"} onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Compétition</Label>
              <Select value={competitionId} onValueChange={setCompetitionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une compétition" />
                </SelectTrigger>
                <SelectContent>
                  {comps.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="opponent">Adversaire</Label>
                <Input id="opponent" name="opponent" defaultValue={editing?.opponent} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opponent_country_code">Code pays</Label>
                <Input
                  id="opponent_country_code"
                  name="opponent_country_code"
                  maxLength={2}
                  placeholder="SN"
                  className="uppercase"
                  defaultValue={editing?.opponent_country_code ?? ""}
                  onChange={(e) => (e.target.value = e.target.value.toUpperCase())}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue">Lieu</Label>
              <Input id="venue" name="venue" defaultValue={editing?.venue ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="match_date">Date et heure</Label>
              <Input
                id="match_date"
                name="match_date"
                type="datetime-local"
                defaultValue={editing ? toDatetimeLocal(editing.match_date) : undefined}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ticket_price">Prix (FCFA)</Label>
                <Input
                  id="ticket_price"
                  name="ticket_price"
                  type="number"
                  min={0}
                  defaultValue={editing?.ticket_price}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tickets_available">Places disponibles</Label>
                <Input
                  id="tickets_available"
                  name="tickets_available"
                  type="number"
                  min={0}
                  defaultValue={editing?.tickets_available}
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <Label htmlFor="is_home">Match à domicile</Label>
              <Switch id="is_home" checked={isHome} onCheckedChange={setIsHome} />
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
