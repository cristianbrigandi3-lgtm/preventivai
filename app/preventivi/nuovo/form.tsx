"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { calcTotals, eur } from "@/lib/quotes";
import { inputCls, btnPrimary, btnGhost, Card } from "@/components/ui";

type Item = { description: string; qty: number; unit: string; unitPrice: number; discountPct: number; vatPct: number; serviceId?: string };
const blank: Item = { description: "", qty: 1, unit: "pz", priceUnit: 0 } as any;

export default function NewQuote() {
  const router = useRouter();
  const [customers, setCustomers] = useState<{ id: string; label: string }[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [nc, setNc] = useState({ business: "", firstName: "", lastName: "", email: "", phone: "", address: "", piva: "", cf: "" });
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [payTerms, setPayTerms] = useState("");
  const [validity, setValidity] = useState("30 giorni");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Item[]>([{ description: "Manodopera installazione", qty: 1, unit: "corpo", unitPrice: 800, discountPct: 0, vatPct: 22 }]);
  const [showPreview, setShowPreview] = useState(false);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [svcQ, setSvcQ] = useState("");
  const [svcRes, setSvcRes] = useState<any[]>([]);
  const [aiText, setAiText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  async function searchSvc(v: string) {
    setSvcQ(v);
    if (v.trim().length < 2) { setSvcRes([]); return; }
    try {
      const r = await fetch(`/api/services?q=${encodeURIComponent(v)}`, { cache: "no-store" });
      const d = await r.json();
      setSvcRes(d.services || []);
    } catch { setSvcRes([]); }
  }

  function addSvc(s: any) {
    setItems([...items, { description: s.description ? `${s.name} — ${s.description}` : s.name, qty: 1, unit: s.unit || "pz", unitPrice: s.price || 0, discountPct: 0, vatPct: s.vatPct ?? 22, serviceId: s.id }]);
    setSvcRes([]); setSvcQ("");
  }

  async function aiDraft() {
    setErr(""); setAiBusy(true);
    try {
      const r = await fetch("/api/ai/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: aiText }) });
      let d: any = {};
      try { d = await r.json(); } catch { throw new Error("AI non disponibile, riprova."); }
      if (!r.ok) throw new Error(d.error || "AI non disponibile");
      if (d.subject) setSubject(d.subject);
      if (d.customer) setNc({ ...nc, business: d.customer });
      if (d.items?.length) setItems(d.items.map((i: any) => ({ description: i.description, qty: i.qty, unit: i.unit, unitPrice: 0, discountPct: 0, vatPct: 22 })));
      setErr("Bozza AI inserita: controlla e inserisci i prezzi (a 0 = da definire).");
    } catch (e: any) { setErr(e.message); }
    setAiBusy(false);
  }

  useEffect(() => {
    fetch("/api/quotes", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) return { customers: [] };
        const ct = r.headers.get("content-type") || "";
        if (!ct.includes("json")) return { customers: [] };
        return r.json().catch(() => ({ customers: [] }));
      })
      .then((d) => setCustomers(d.customers || []))
      .catch(() => setCustomers([]));
  }, []);
  const t = useMemo(() => calcTotals(items.map((i) => ({ ...i, qty: +i.qty || 0, unitPrice: +i.unitPrice || 0, discountPct: +i.discountPct || 0, vatPct: +i.vatPct || 22 }))), [items]);

  const upd = (idx: number, k: keyof Item, v: any) => setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, [k]: v } : it)));

  async function save() {
    setErr(""); setSaving(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customerId || null, newCustomer: customerId ? null : nc, subject, description, dueDate: dueDate || null, payTerms, validity, notes, items })
      });
      let d: any = {};
      try { d = await res.json(); } catch { throw new Error(`Salvataggio fallito (HTTP ${res.status}). Riprova.`); }
      if (!res.ok) throw new Error(d.error || "Errore salvataggio");
      router.push(`/preventivi/${d.id}`);
    } catch (e: any) { setErr(e.message); setSaving(false); }
  }

  const preview = (
    <Card className="text-sm">
      <p className="font-bold text-lg">Preventivo — {subject || "Oggetto..."}</p>
      <p className="text-slate-500">{description || "Descrizione..."}</p>
      <table className="mt-3 w-full text-xs">
        <thead><tr className="text-left text-slate-500"><th>Voce</th><th className="text-right">Totale</th></tr></thead>
        <tbody>{t.lines.map((l, i) => <tr key={i} className="border-t"><td className="py-1">{l.description} · {l.qty} {l.unit}</td><td className="text-right">{eur(l.lineTotal)}</td></tr>)}</tbody>
      </table>
      <div className="mt-3 space-y-1">
        <p>Imponibile: <b>{eur(t.subtotal)}</b></p>
        <p>IVA: <b>{eur(t.vatTotal)}</b></p>
        <p className="text-base">Totale: <b className="text-green-700">{eur(t.total)}</b></p>
      </div>
    </Card>
  );

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="space-y-3">
        {err && <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">{err}</p>}
        <Card>
          <h2 className="font-semibold">✨ Genera da richiesta cliente <span className="text-xs font-normal text-slate-500">(AI, opz.)</span></h2>
          <textarea value={aiText} onChange={(e) => setAiText(e.target.value)} rows={3} placeholder="Incolla la richiesta del cliente (es. rifare impianto elettrico 90mq: 6 punti luce, 12 prese...)" className={`${inputCls} mt-2`} />
          <button onClick={aiDraft} disabled={aiBusy || aiText.trim().length < 20} className={`${btnGhost} mt-2`}>{aiBusy ? "Analisi..." : "Genera bozza"}</button>
        </Card>
        <Card>
          <h2 className="font-semibold">Cliente</h2>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={`${inputCls} mt-2`}>
            <option value="">— Nuovo cliente —</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          {!customerId && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input placeholder="Ragione sociale" value={nc.business} onChange={(e) => setNc({ ...nc, business: e.target.value })} className={inputCls} />
              <input placeholder="Email cliente" value={nc.email} onChange={(e) => setNc({ ...nc, email: e.target.value })} className={inputCls} />
              <input placeholder="Nome" value={nc.firstName} onChange={(e) => setNc({ ...nc, firstName: e.target.value })} className={inputCls} />
              <input placeholder="Cognome" value={nc.lastName} onChange={(e) => setNc({ ...nc, lastName: e.target.value })} className={inputCls} />
              <input placeholder="Telefono" value={nc.phone} onChange={(e) => setNc({ ...nc, phone: e.target.value })} className={inputCls} />
              <input placeholder="P.IVA" value={nc.piva} onChange={(e) => setNc({ ...nc, piva: e.target.value })} className={inputCls} />
            </div>
          )}
        </Card>
        <Card>
          <h2 className="font-semibold">Dati preventivo</h2>
          <div className="mt-2 space-y-2">
            <input placeholder="Oggetto * (es. Rifacimento bagno)" value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} />
            <textarea placeholder="Descrizione generale" value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} rows={2} />
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs">Scadenza<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} /></label>
              <label className="text-xs">Validità<input value={validity} onChange={(e) => setValidity(e.target.value)} className={inputCls} /></label>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex justify-between items-center"><h2 className="font-semibold">Voci</h2><button onClick={() => setItems([...items, { description: "", qty: 1, unit: "pz", unitPrice: 0, discountPct: 0, vatPct: 22 }])} className={btnGhost}>+ Riga</button></div>
          <div className="mt-2">
            <input placeholder="Cerca nel catalogo e aggiungi..." value={svcQ} onChange={(e) => searchSvc(e.target.value)} className={inputCls} />
            {svcRes.length > 0 && (
              <div className="mt-1 rounded-xl border bg-white divide-y text-sm">
                {svcRes.map((s) => (
                  <button key={s.id} onClick={() => addSvc(s)} className="w-full text-left px-3 py-2 hover:bg-slate-50">
                    <b>{s.name}</b> <span className="text-slate-500">· €{s.price}/{s.unit}{s.category ? ` · ${s.category}` : ""}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-2 space-y-2">
            {items.map((it, i) => (
              <div key={i} className="rounded-xl border p-2 space-y-2">
                <input placeholder="Descrizione voce" value={it.description} onChange={(e) => upd(i, "description", e.target.value)} className={inputCls} />
                <div className="grid grid-cols-3 gap-2">
                  <label className="text-xs">Qtà<input type="number" min={0} step="any" value={it.qty} onChange={(e) => upd(i, "qty", e.target.value)} className={inputCls} /></label>
                  <label className="text-xs">Unità<input value={it.unit} onChange={(e) => upd(i, "unit", e.target.value)} className={inputCls} /></label>
                  <label className="text-xs">Prezzo €<input type="number" min={0} step="any" value={it.unitPrice} onChange={(e) => upd(i, "unitPrice", e.target.value)} className={inputCls} /></label>
                  <label className="text-xs">Sconto %<input type="number" value={it.discountPct} onChange={(e) => upd(i, "discountPct", e.target.value)} className={inputCls} /></label>
                  <label className="text-xs">IVA %<input type="number" value={it.vatPct} onChange={(e) => upd(i, "vatPct", e.target.value)} className={inputCls} /></label>
                  <button onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-xs text-red-600">Rimuovi</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">Condizioni</h2>
          <div className="mt-2 space-y-2">
            <input placeholder="Modalità di pagamento" value={payTerms} onChange={(e) => setPayTerms(e.target.value)} className={inputCls} />
            <input placeholder="Note" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
          </div>
        </Card>
        <div className="flex gap-2">
          <button onClick={save} disabled={saving || !subject} className={btnPrimary}>{saving ? "Salvataggio..." : "Salva preventivo"}</button>
          <button onClick={() => setShowPreview(!showPreview)} className={`${btnGhost} lg:hidden`}>Visualizza anteprima</button>
        </div>
        {showPreview && <div className="lg:hidden">{preview}</div>}
      </div>
      <div className="hidden lg:block"><div className="sticky top-4">{preview}</div></div>
    </div>
  );
}
