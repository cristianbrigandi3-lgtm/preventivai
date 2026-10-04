export type ItemInput = { description: string; qty: number; unit: string; unitPrice: number; discountPct: number; vatPct: number };

export function calcTotals(items: ItemInput[]) {
  let subtotal = 0, discount = 0, vatTotal = 0;
  const lines = items.map((it) => {
    const gross = it.qty * it.unitPrice;
    const d = gross * ((it.discountPct || 0) / 100);
    const net = gross - d;
    const vat = net * ((it.vatPct || 0) / 100);
    subtotal += net;
    discount += d;
    vatTotal += vat;
    return { ...it, lineTotal: +(net + vat).toFixed(2) };
  });
  const total = +(subtotal + vatTotal).toFixed(2);
  return { lines, subtotal: +subtotal.toFixed(2), discount: +discount.toFixed(2), vatTotal: +vatTotal.toFixed(2), total };
}

export const eur = (n: number) => n.toLocaleString("it-IT", { style: "currency", currency: "EUR" });

export const STATI = ["Bozza", "Inviato", "Visualizzato", "Accettato", "Rifiutato", "Scaduto"] as const;

export function statusColor(s: string) {
  if (s === "Accettato") return "bg-green-100 text-green-800";
  if (s === "Rifiutato" || s === "Scaduto") return "bg-red-100 text-red-800";
  if (s === "Inviato" || s === "Visualizzato") return "bg-indigo-100 text-indigo-800";
  return "bg-slate-200 text-slate-700";
}
