"use client";
import { useState } from "react";
import { inputCls, btnGhost } from "@/components/ui";

export type Fu = { enabled: boolean; day1: number; day2: number; text1: string; text2: string; sent1: boolean; sent2: boolean };

export default function FollowUpCard({ id, initial }: { id: string; initial: Fu }) {
  const [f, setF] = useState(initial);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true); setMsg("");
    const r = await fetch(`/api/quotes/${id}/followup`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: f.enabled, day1: +f.day1, day2: +f.day2, text1: f.text1, text2: f.text2 })
    });
    setMsg(r.ok ? "Impostazioni follow-up salvate." : "Errore salvataggio.");
    setBusy(false);
  }

  return (
    <div className="rounded-2xl border bg-white p-4 text-sm space-y-2">
      <h2 className="font-semibold">Follow-up automatici {(f.sent1 || f.sent2) && <span className="text-xs text-slate-500">(inviati: {[f.sent1 && "1°", f.sent2 && "2°"].filter(Boolean).join(", ")})</span>}</h2>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={f.enabled} onChange={(e) => setF({ ...f, enabled: e.target.checked })} />
        Attiva reminder per questo preventivo
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs">1° reminder dopo (giorni)<input type="number" min={1} value={f.day1} onChange={(e) => setF({ ...f, day1: +e.target.value })} className={inputCls} /></label>
        <label className="text-xs">2° reminder dopo (giorni)<input type="number" min={1} value={f.day2} onChange={(e) => setF({ ...f, day2: +e.target.value })} className={inputCls} /></label>
      </div>
      <textarea value={f.text1} onChange={(e) => setF({ ...f, text1: e.target.value })} rows={2} placeholder="Testo 1° reminder (vuoto = automatico)" className={inputCls} />
      <textarea value={f.text2} onChange={(e) => setF({ ...f, text2: e.target.value })} rows={2} placeholder="Testo 2° reminder (vuoto = automatico)" className={inputCls} />
      <button onClick={save} disabled={busy} className={btnGhost}>{busy ? "Salvataggio..." : "Salva follow-up"}</button>
      {msg && <p className="text-slate-600">{msg}</p>}
    </div>
  );
}
