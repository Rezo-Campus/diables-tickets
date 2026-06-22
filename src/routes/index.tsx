import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Ticket, QrCode, Trophy, Smartphone } from "lucide-react";
import hero from "@/assets/hero-stadium.jpg";

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
