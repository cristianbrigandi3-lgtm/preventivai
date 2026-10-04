"use client";
import { useState } from "react";
import { inputCls, btnPrimary } from "@/components/ui";

export default function SendForm({ id, defaultTo }: { id: string; defaultTo: string }) {
  const [to, setTo] = useState(defaultTo);
  const [message, setMessage] = useState("");
  const [state, setState] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true); setState("");
    try {
      const r = await fetch(`/api/quotes/${id}/send`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, message })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Errore invio");
      setState(`Inviato a ${d.to} (${d.status}). Stato → Inviato.`);
    } catch (e: any) { setState("Errore: " + e.message); }
    setBusy(false);
  }

  return (
    <div className="rounded-2xl border bg-white p-4 text-sm space-y-2">
      <h2 className="font-semibold">Invia via email</h2>
      <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="email@cliente.it" className={inputCls} />
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Messaggio personalizzato (opzionale)" rows={2} className={inputCls} />
      <button onClick={send} disabled={busy || !to} className={btnPrimary}>{busy ? "Invio..." : "Invia email + PDF"}</button>
      {state && <p className="text-slate-600">{state}</p>}
      <p className="text-xs text-slate-400">Senza SMTP configurato l'invio viene registrato nel log (EmailLog) senza spedizione reale.</p>
    </div>
  );
}
