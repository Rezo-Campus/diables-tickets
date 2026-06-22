import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import QRCode from "qrcode";
import { Loader2, Calendar, MapPin, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/mes-tickets")({
  head: () => ({ meta: [{ title: "Mes tickets — Diables Rouges" }] }),
  component: MyTickets,
});

type TicketRow = {
  id: string;
  code: string;
  used_at: string | null;
  paid: boolean;
  created_at: string;
  matches: {
    opponent: string;
    venue: string | null;
    match_date: string;
    is_home: boolean;
    competitions: { name: string } | null;
  } | null;
};

function MyTickets() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketRow[] | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("tickets")
      .select("id, code, used_at, paid, created_at, matches(opponent, venue, match_date, is_home, competitions(name))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setTickets((data ?? []) as any);
      });
  }, [user]);

  if (authLoading || !user)
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <h1 className="mb-3 text-4xl font-black tracking-tight">Mes tickets</h1>
      <p className="mb-10 text-muted-foreground">
        Présentez le QR code à l'entrée du stade. Chaque ticket n'est valable qu'une seule fois.
      </p>
      {tickets === null ? (
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
      ) : tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Vous n'avez encore aucun ticket.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {tickets.map((t) => (
            <TicketCard key={t.id} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function TicketCard({ t }: { t: TicketRow }) {
  const [qr, setQr] = useState<string>("");
  useEffect(() => {
    QRCode.toDataURL(t.code, { width: 320, margin: 1, color: { dark: "#000000", light: "#ffffff" } }).then(setQr);
  }, [t.code]);
  const m = t.matches;
  const date = m ? new Date(m.match_date) : null;
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border bg-primary/10 px-5 py-3">
        <div className="text-xs uppercase tracking-widest text-primary">
          {m?.competitions?.name ?? "Match"}
        </div>
        <div className="font-bold">
          {m?.is_home ? "Diables Rouges" : m?.opponent} vs {m?.is_home ? m?.opponent : "Diables Rouges"}
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-4 p-5">
        <div className="space-y-2 text-sm">
          {date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              {" • "}
              {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
          {m?.venue && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" /> {m.venue}
            </div>
          )}
          <div className="pt-2 font-mono text-xs text-muted-foreground">
            #{t.code.slice(0, 8).toUpperCase()}
          </div>
          {t.used_at && (
            <div className="mt-2 flex items-center gap-1 rounded-md bg-destructive/20 px-2 py-1 text-xs font-semibold text-destructive">
              <CheckCircle2 className="h-3.5 w-3.5" /> Déjà utilisé
            </div>
          )}
        </div>
        <div className={`grid place-items-center rounded-lg bg-white p-2 ${t.used_at ? "opacity-30" : ""}`}>
          {qr ? <img src={qr} alt="QR" width={140} height={140} /> : <Loader2 className="h-6 w-6 animate-spin" />}
        </div>
      </div>
    </div>
  );
}