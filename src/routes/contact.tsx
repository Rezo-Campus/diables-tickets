import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Diables Rouges" },
      { name: "description", content: "Contactez la billetterie officielle des Diables Rouges." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <h1 className="mb-3 text-5xl font-black tracking-tight">Contactez-nous</h1>
      <p className="mb-12 max-w-2xl text-muted-foreground">
        Une question sur un ticket, un paiement ou l'accès au stade ? Notre équipe vous répond.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Mail, label: "Email", value: "billetterie@diablesrouges.cg" },
          { icon: Phone, label: "Téléphone", value: "+242 06 000 00 00" },
          { icon: MapPin, label: "Adresse", value: "Stade Massamba-Débat, Brazzaville" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-6">
            <Icon className="mb-3 h-6 w-6 text-primary" />
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
            <div className="mt-1 font-semibold">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}