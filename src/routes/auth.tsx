import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Connexion — Diables Rouges" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/competitions" });
  }, [user, navigate]);

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await signIn(String(fd.get("email")), String(fd.get("password")));
    setLoading(false);
    if (error) toast.error(error);
    else toast.success("Connexion réussie");
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await signUp(
      String(fd.get("email")),
      String(fd.get("password")),
      String(fd.get("fullName")),
    );
    setLoading(false);
    if (error) toast.error(error);
    else toast.success("Compte créé ! Vérifiez votre email si la confirmation est activée.");
  }

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <h1 className="mb-2 text-center text-4xl font-black">Bienvenue</h1>
      <p className="mb-8 text-center text-muted-foreground">Connectez-vous pour acheter vos tickets</p>
      <Tabs defaultValue="signin" className="rounded-2xl border border-border bg-card p-6">
        <TabsList className="mb-6 grid w-full grid-cols-2">
          <TabsTrigger value="signin">Connexion</TabsTrigger>
          <TabsTrigger value="signup">Inscription</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-in">Email</Label>
              <Input id="email-in" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pass-in">Mot de passe</Label>
              <Input id="pass-in" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Se connecter
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="signup">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name-up">Nom complet</Label>
              <Input id="name-up" name="fullName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-up">Email</Label>
              <Input id="email-up" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pass-up">Mot de passe</Label>
              <Input id="pass-up" name="password" type="password" required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Créer mon compte
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}