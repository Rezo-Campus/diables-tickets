import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, type Competition, type Match } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Trophy, Calendar, MapPin, Loader2, Ticket } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/competitions")({
  head: () => ({
    meta: [
      { title: "Compétitions — Diables Rouges" },
      { name: "description", content: "Calendrier et tickets pour toutes les compétitions des Diables Rouges." },
    ],
  }),
  component: CompetitionsPage,
});

function CompetitionsPage() {
  const [comps, setComps] = useState<Competition[] | null>(null);
  const [selected, setSelected] = useState<Competition | null>(null);

  useEffect(() => {
    supabase
      .from("competitions")
      .select("*")
      .order("name")
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setComps(data ?? []);
      });
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <h1 className="mb-3 text-5xl font-black tracking-tight">Compétitions</h1>
      <p className="mb-12 max-w-2xl text-muted-foreground">
        Cliquez sur une compétition pour voir le calendrier et acheter vos tickets.
      </p>

      {comps === null ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : comps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Aucune compétition pour le moment. Exécutez le script SQL dans Supabase.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {comps.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-6 text-left transition hover:border-primary hover:bg-card/80"
            >
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Trophy className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{c.name}</h3>
                {c.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                )}
                <span className="mt-3 inline-block text-sm font-semibold text-primary">
                  Voir le calendrier →
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selected?.name}</DialogTitle>
            <DialogDescription>Calendrier des matchs et achat de tickets</DialogDescription>
          </DialogHeader>
          {selected && <MatchesList competition={selected} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MatchesList({ competition }: { competition: Competition }) {
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    supabase
      .from("matches")
      .select("*")
      .eq("competition_id", competition.id)
      .order("match_date")
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setMatches(data ?? []);
      });
  }, [competition.id, reload]);

  if (matches === null)
    return (
      <div className="py-10 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
      </div>
    );

  if (matches.length === 0)
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Aucun match programmé pour cette compétition.
      </div>
    );

  return (
    <div className="space-y-3 py-2">
      {matches.map((m) => (
        <MatchRow key={m.id} match={m} onBought={() => setReload((r) => r + 1)} />
      ))}
    </div>
  );
}

function MatchRow({ match, onBought }: { match: Match; onBought: () => void }) {
  const { user } = useAuth();
  const [buying, setBuying] = useState(false);
  const date = new Date(match.match_date);
  const dateStr = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const soldOut = match.tickets_available <= 0;

  async function buy() {
    if (!user) {
      toast.error("Connectez-vous pour acheter un ticket");
      return;
    }
    setBuying(true);
    try {
      // 1. Décrémenter le stock atomiquement via RPC
      const { data: dec, error: decErr } = await supabase.rpc("buy_match_ticket", {
        p_match_id: match.id,
      });
      if (decErr) throw decErr;
      const ticketId = dec as string;
      toast.success("Ticket acheté ! Retrouvez votre QR code dans Mes tickets.");
      onBought();
      // Trigger redirection vers mes tickets
      window.location.href = `/mes-tickets?new=${ticketId}`;
    } catch (e: any) {
      toast.error(e.message ?? "Achat impossible");
    } finally {
      setBuying(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="font-bold">
          {match.is_home ? "Diables Rouges" : match.opponent} <span className="text-muted-foreground">vs</span>{" "}
          {match.is_home ? match.opponent : "Diables Rouges"}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> {dateStr} • {timeStr}
          </span>
          {match.venue && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {match.venue}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-lg font-black text-primary">{match.ticket_price.toLocaleString("fr-FR")} FCFA</div>
          <div className={`text-xs ${soldOut ? "text-destructive" : "text-muted-foreground"}`}>
            {soldOut ? "Épuisé" : `${match.tickets_available} restants`}
          </div>
        </div>
        {user ? (
          <Button onClick={buy} disabled={soldOut || buying} className="gap-2">
            {buying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />}
            Acheter
          </Button>
        ) : (
          <Link to="/auth">
            <Button variant="outline">Se connecter</Button>
          </Link>
        )}
      </div>
    </div>
  );
}