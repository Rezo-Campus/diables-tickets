import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Trophy, CalendarDays, Users, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin — Diables Rouges" }] }),
  component: AdminIndexPage,
});

function AdminIndexPage() {
  const { loading, rolesLoading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !rolesLoading && !isAdmin) navigate({ to: "/" });
  }, [loading, rolesLoading, isAdmin, navigate]);

  if (loading || rolesLoading || !isAdmin)
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  const links = [
    {
      to: "/admin/competitions",
      label: "Compétitions",
      icon: Trophy,
      desc: "Créer et modifier les compétitions",
    },
    {
      to: "/admin/matches",
      label: "Matchs",
      icon: CalendarDays,
      desc: "Gérer le calendrier et les billets disponibles",
    },
    {
      to: "/admin/users",
      label: "Utilisateurs",
      icon: Users,
      desc: "Attribuer les rôles commercial / admin",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="mb-2 text-4xl font-black tracking-tight">Administration</h1>
      <p className="mb-12 text-muted-foreground">
        Gestion des compétitions, des matchs et des accès.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition hover:border-primary hover:bg-card/80"
          >
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
              <l.icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{l.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{l.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
