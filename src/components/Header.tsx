import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Ticket, LogOut, ScanLine } from "lucide-react";

export function Header() {
  const { user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 font-black tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40">
            DR
          </span>
          <span className="text-lg">Diables Rouges</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {[
            { to: "/", label: "Accueil" },
            { to: "/competitions", label: "Compétitions" },
            { to: "/contact", label: "Contact" },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              activeProps={{ className: "text-foreground bg-muted" }}
              activeOptions={{ exact: true }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/mes-tickets">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Ticket className="h-4 w-4" /> Mes tickets
                </Button>
              </Link>
              <Link to="/scan">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ScanLine className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => signOut()} className="gap-2">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Connexion
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}