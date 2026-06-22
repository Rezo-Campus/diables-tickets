import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Ticket, QrCode, Trophy, Smartphone, Calendar, MapPin } from "lucide-react";
import hero from "@/assets/hero-stadium.jpg";
import { supabase, type Match } from "@/lib/supabase";
import { TEAM_LOGO_URL } from "@/lib/team";
import { TeamSide } from "@/components/TeamSide";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Diables Rouges — Billetterie officielle" },
      { name: "description", content: "Achetez vos tickets pour les matchs des Diables Rouges. Paiement Mobile Money, QR code à l'entrée du stade." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <img
          src={hero}
          alt="Stade en feu"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-32 md:py-44">
          <img
            src={TEAM_LOGO_URL}
            alt="Diables Rouges"
            className="h-20 w-20 rounded-2xl object-cover shadow-xl"
          />
          <span className="rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            Billetterie officielle
          </span>
          <h1 className="max-w-3xl text-5xl font-black leading-[1.05] tracking-tight md:text-7xl">
            Vivez chaque match des <span className="text-primary">Diables Rouges</span>.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Achetez votre ticket en ligne, payez par Mobile Money, et entrez au stade
            avec un simple QR code. Rapide, sécurisé, sans file d'attente.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/competitions">
              <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Ticket className="h-5 w-5" /> Acheter un ticket
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline">
                Nous contacter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <UpcomingMatches />

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Trophy, title: "Toutes les compétitions", text: "CAN, Coupe du Monde, Coupe de la Confédération et amicaux." },
            { icon: Smartphone, title: "Paiement Mobile Money", text: "MTN Mobile Money et Airtel Money acceptés." },
            { icon: QrCode, title: "QR Code à usage unique", text: "Un scan à l'entrée du stade, valide une seule fois." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6 transition hover:border-primary/50">
              <Icon className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-2 text-lg font-bold">{title}</h3>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

type UpcomingMatch = Match & { competitions: { name: string } | null };

function UpcomingMatches() {
  const [matches, setMatches] = useState<UpcomingMatch[] | null>(null);

  useEffect(() => {
    supabase
      .from("matches")
      .select("*, competitions(name)")
      .gte("match_date", new Date().toISOString())
      .order("match_date")
      .then(({ data, error }) => {
        if (error) return;
        setMatches((data as UpcomingMatch[] | null) ?? []);
      });
  }, []);

  const featured = useMemo(() => {
    if (!matches) return [];
    const seen = new Set<string>();
    const result: UpcomingMatch[] = [];
    for (const m of matches) {
      if (seen.has(m.competition_id)) continue;
      seen.add(m.competition_id);
      result.push(m);
    }
    return result;
  }, [matches]);

  if (featured.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="mb-8 text-3xl font-black tracking-tight">Prochains matchs</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {featured.map((m) => {
          const date = new Date(m.match_date);
          const dateStr = date.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          });
          const timeStr = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
          return (
            <div key={m.id} className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
                {m.competitions?.name}
              </div>
              <div className="mb-4 flex items-center justify-between gap-2 text-lg font-bold">
                <TeamSide
                  showHomeTeam={m.is_home}
                  opponent={m.opponent}
                  opponentCountryCode={m.opponent_country_code}
                />
                <span className="text-sm text-muted-foreground">vs</span>
                <TeamSide
                  showHomeTeam={!m.is_home}
                  opponent={m.opponent}
                  opponentCountryCode={m.opponent_country_code}
                />
              </div>
              <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> {dateStr} • {timeStr}
                </span>
                {m.venue && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {m.venue}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-primary">
                  {m.ticket_price.toLocaleString("fr-FR")} FCFA
                </span>
                <Link to="/competitions">
                  <Button size="sm" className="gap-2">
                    <Ticket className="h-4 w-4" /> Réserver
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
