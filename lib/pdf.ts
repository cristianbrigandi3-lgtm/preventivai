import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type PdfData = {
  company: { name: string; address?: string | null; piva?: string | null; cf?: string | null; phone?: string | null; email?: string | null; iban?: string | null };
  customer: { label: string; address?: string | null; piva?: string | null; cf?: string | null; email?: string | null; phone?: string | null };
  quote: { number: string; date: string; dueDate?: string | null; subject: string; description?: string | null; payTerms?: string | null; validity?: string | null; notes?: string | null; subtotal: number; discount: number; vatTotal: number; total: number };
  items: { description: string; qty: number; unit: string; unitPrice: number; discountPct: number; vatPct: number; lineTotal: number }[];
};

const eur = (n: number) => `EUR ${n.toFixed(2)}`;

export async function renderQuotePdf(d: PdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595, 842]);
  let y = 800;
  const line = (t: string, x = 50, size = 10, b = false, color = rgb(0.15, 0.15, 0.2)) => {
    page.drawText(t.slice(0, 110), { x, y, size, font: b ? bold : font, color });
    y -= size + 5;
  };
  page.drawRectangle({ x: 0, y: 780, width: 595, height: 62, color: rgb(0.23, 0.25, 0.65) });
  page.drawText(`PREVENTIVO ${d.quote.number}`, { x: 50, y: 810, size: 18, font: bold, color: rgb(1, 1, 1) });
  page.drawText(d.company.name || "PreventivAI", { x: 50, y: 792, size: 10, font, color: rgb(1, 1, 1) });
  y = 758;
  line(`Data: ${d.quote.date}   Scadenza: ${d.quote.dueDate || "-"}`, 50, 10);
  line(`Cliente: ${d.customer.label}`, 50, 10, true);
  if (d.customer.address) line(d.customer.address, 50, 9);
  if (d.customer.piva) line(`P.IVA ${d.customer.piva}`, 50, 9);
  y -= 4;
  line(`Oggetto: ${d.quote.subject}`, 50, 11, true);
  if (d.quote.description) line(d.quote.description, 50, 9);
  y -= 6;
  for (const it of d.items) {
    if (y < 140) { page = pdf.addPage([595, 842]); y = 800; }
    line(`${it.description} — ${it.qty} ${it.unit} x ${eur(it.unitPrice)} (sc.${it.discountPct}% IVA ${it.vatPct}%) = ${eur(it.lineTotal)}`, 50, 9);
  }
  y -= 6;
  line(`Imponibile: ${eur(d.quote.subtotal)}`, 50, 10, true);
  line(`Sconto: ${eur(d.quote.discount)}`, 50, 10);
  line(`IVA: ${eur(d.quote.vatTotal)}`, 50, 10);
  line(`TOTALE: ${eur(d.quote.total)}`, 50, 14, true, rgb(0.1, 0.4, 0.2));
  if (d.quote.payTerms) line(`Pagamento: ${d.quote.payTerms}`, 50, 9);
  if (d.quote.validity) line(`Validita: ${d.quote.validity}`, 50, 9);
  if (d.quote.notes) line(`Note: ${d.quote.notes}`, 50, 9);
  if (d.company.iban) line(`IBAN: ${d.company.iban}`, 50, 9);
  if (d.company.piva) line(`${d.company.name} — P.IVA ${d.company.piva} ${d.company.phone || ""} ${d.company.email || ""}`, 50, 8);
  return pdf.save();
}
