import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/ratelimit";

// AI "da richiesta a preventivo": analizza il testo incollato e propone una BOZZA.
// Prezzi mai inventati: unitPrice sempre 0 con flag needsPrice=true.
export async function POST(req: Request) {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rl = rateLimit(`ai:${uid}`, 10, 60000);
  if (!rl.ok) return NextResponse.json({ error: "Troppe richieste, riprova tra poco" }, { status: 429 });
  const { text } = await req.json().catch(() => ({ text: "" }));
  if (!String(text || "").trim() || String(text).length < 20) {
    return NextResponse.json({ error: "Incolla una richiesta di almeno 20 caratteri" }, { status: 400 });
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: "AI non configurata (manca ANTHROPIC_API_KEY)" }, { status: 501 });

  const prompt = `Sei un assistente per artigiani italiani. Analizza la richiesta cliente e restituisci SOLO JSON valido:
{"customer": "nome o azienda se riconoscibile, altrimenti stringa vuota", "subject": "titolo breve del lavoro", "items": [{"description": "...", "qty": numero, "unit": "pz|ore|corpo|mq|..."}]}
Regole: non inventare prezzi. Max 8 voci. Unità realistiche per il settore.
Richiesta: """${String(text).slice(0, 2000)}"""`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 800, messages: [{ role: "user", content: prompt }] })
    });
    if (!r.ok) return NextResponse.json({ error: "Servizio AI non disponibile, riprova più tardi" }, { status: 502 });
    const d = await r.json();
    const raw = d.content?.[0]?.text || "";
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return NextResponse.json({ error: "Risposta AI non valida, riprova" }, { status: 502 });
    const parsed = JSON.parse(m[0]);
    const items = (parsed.items || []).slice(0, 8).map((i: any) => ({
      description: String(i.description || "").slice(0, 200),
      qty: Number(i.qty) > 0 ? Number(i.qty) : 1,
      unit: String(i.unit || "pz").slice(0, 20),
      unitPrice: 0, discountPct: 0, vatPct: 22, needsPrice: true
    })).filter((i: any) => i.description);
    return NextResponse.json({ customer: String(parsed.customer || ""), subject: String(parsed.subject || "").slice(0, 150), items });
  } catch {
    return NextResponse.json({ error: "Servizio AI non disponibile, riprova più tardi" }, { status: 502 });
  }
}
