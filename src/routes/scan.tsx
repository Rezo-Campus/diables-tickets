import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, ScanLine } from "lucide-react";

export const Route = createFileRoute("/scan")({
  head: () => ({ meta: [{ title: "Scan QR — Diables Rouges" }] }),
  component: ScanPage,
});

type Result = { ok: boolean; message: string; match?: string } | null;

function ScanPage() {
  const { user, loading, canScan, rolesLoading } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const lastScan = useRef<string>("");

  useEffect(() => {
    if (!loading && !rolesLoading && !canScan) navigate({ to: "/auth" });
  }, [loading, rolesLoading, canScan, navigate]);

  async function start() {
    setResult(null);
    const { Html5Qrcode } = await import("html5-qrcode");
    const id = "qr-reader";
    if (!containerRef.current) return;
    containerRef.current.innerHTML = `<div id="${id}" class="w-full"></div>`;
    const scanner = new Html5Qrcode(id);
    scannerRef.current = scanner;
    setScanning(true);
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        async (text: string) => {
          if (text === lastScan.current) return;
          lastScan.current = text;
          await validate(text);
        },
        () => {},
      );
    } catch (e: any) {
      setScanning(false);
      setResult({ ok: false, message: "Impossible d'accéder à la caméra: " + e.message });
    }
  }

  async function stop() {
    try {
      await scannerRef.current?.stop();
      await scannerRef.current?.clear();
    } catch {}
    setScanning(false);
  }

  async function validate(code: string) {
    const { data, error } = await supabase.rpc("validate_ticket_secure", { p_code: code });
    if (error) {
      setResult({ ok: false, message: error.message });
      return;
    }
    const row = (data as any)?.[0] ?? data;
    if (row?.status === "valid") {
      setResult({ ok: true, message: "Ticket validé ✓", match: row.match_label });
    } else if (row?.status === "already_used") {
      setResult({ ok: false, message: "Ticket déjà utilisé", match: row.match_label });
    } else {
      setResult({ ok: false, message: "Ticket invalide" });
    }
    setTimeout(() => {
      lastScan.current = "";
      setResult(null);
    }, 3500);
  }

  useEffect(() => () => { stop(); }, []);

  if (loading || rolesLoading || !user || !canScan)
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-2 text-3xl font-black tracking-tight">Contrôle des tickets</h1>
      <p className="mb-6 text-muted-foreground">Scannez le QR code à l'entrée du stade.</p>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div ref={containerRef} className="aspect-square w-full bg-black/40" />
        <div className="p-4">
          {!scanning ? (
            <Button onClick={start} className="w-full gap-2" size="lg">
              <ScanLine className="h-5 w-5" /> Démarrer le scan
            </Button>
          ) : (
            <Button onClick={stop} variant="outline" className="w-full" size="lg">
              Arrêter
            </Button>
          )}
        </div>
      </div>

      {result && (
        <div
          className={`mt-6 flex items-start gap-3 rounded-2xl border p-5 ${
            result.ok
              ? "border-accent bg-accent/15 text-accent-foreground"
              : "border-destructive bg-destructive/15"
          }`}
        >
          {result.ok ? (
            <CheckCircle2 className="h-6 w-6 text-accent" />
          ) : (
            <XCircle className="h-6 w-6 text-destructive" />
          )}
          <div>
            <div className="font-bold">{result.message}</div>
            {result.match && <div className="text-sm opacity-80">{result.match}</div>}
          </div>
        </div>
      )}
    </div>
  );
}