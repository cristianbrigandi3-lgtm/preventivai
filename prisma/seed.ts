import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  await prisma.followUp.deleteMany(); await prisma.quoteEvent.deleteMany(); await prisma.quoteView.deleteMany();
  await prisma.emailLog.deleteMany(); await prisma.quoteItem.deleteMany(); await prisma.quote.deleteMany();
  await prisma.customer.deleteMany(); await prisma.company.deleteMany(); await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();

  const pw = await bcrypt.hash("demo1234", 10);
  const user = await prisma.user.create({ data: { name: "Mario Rossi", email: "demo@preventivai.it", passwordHash: pw, businessName: "Rossi Impianti Elettrici" } });
  const company = await prisma.company.create({
    data: { userId: user.id, name: "Rossi Impianti Elettrici", address: "Via Roma 12, 20121 Milano", piva: "01234567890", phone: "02 1234567", email: "info@rossi-impianti.it", iban: "IT00X0000000000000000000000", defaultPayTerms: "Bonifico 30gg", onboarded: true, quoteCounter: 8 }
  });
  await prisma.subscription.create({ data: { userId: user.id, plan: "PRO" } });

  const clienti = [
    { business: "Condominio Verde", email: "amm@condominioverde.it", phone: "02 1111111", address: "Via Verdi 5, Milano", piva: "11111111111" },
    { firstName: "Laura", lastName: "Bianchi", email: "laura.bianchi@mail.it", phone: "333 1234567", address: "Via Po 8, Torino" },
    { business: "Ristorante Da Nino", email: "info@danino.it", phone: "02 2222222", address: "Corso Italia 20, Milano", piva: "22222222222" },
    { firstName: "Giuseppe", lastName: "Verdi", email: "g.verdi@mail.it", phone: "333 7654321", address: "Via Dante 3, Rho" },
    { business: "Studio Dentistico Sorriso", email: "info@sorriso.it", phone: "02 3333333", address: "Via Manzoni 1, Milano", piva: "33333333333" }
  ];
  const states = ["Bozza", "Inviato", "Visualizzato", "Accettato", "Rifiutato", "Inviato", "Accettato", "Scaduto"];
  const subjects = ["Impianto elettrico appartamento", "Rifacimento quadro + certificazione", "Illuminazione locale ristorante", "Manutenzione straordinaria", "Nuovi punti luce studio", "Domotica villetta", "Messa a norma impianto", "Split e climatizzazione predisposizione"];
  for (let i = 0; i < 8; i++) {
    const cd = clienti[i % clienti.length] as any;
    const c = await prisma.customer.create({ data: { companyId: company.id, business: cd.business || null, firstName: cd.firstName || null, lastName: cd.lastName || null, email: cd.email, phone: cd.phone, address: cd.address, piva: cd.piva || null } });
    const items = [
      { description: "Manodopera installazione", qty: 8 + i, unit: "ore", unitPrice: 45, discountPct: 0, vatPct: 22, lineTotal: 0 },
      { description: "Materiali elettrici", qty: 1, unit: "corpo", unitPrice: 1200 + i * 150, discountPct: i % 3 === 0 ? 5 : 0, vatPct: 22, lineTotal: 0 }
    ];
    let sub = 0, vat = 0, disc = 0;
    for (const it of items) { const g = it.qty * it.unitPrice; const d = g * it.discountPct / 100; const net = g - d; sub += net; disc += d; vat += net * 0.22; it.lineTotal = +(net * 1.22).toFixed(2); }
    await prisma.quote.create({
      data: {
        companyId: company.id, customerId: c.id, number: `2026-${String(i + 1).padStart(3, "0")}`, publicToken: crypto.randomBytes(12).toString("hex"),
        subject: subjects[i], description: "Lavori a regola d'arte con certificazione.", status: states[i],
        payTerms: "Bonifico 30gg", validity: "30 giorni", subtotal: +sub.toFixed(2), discount: +disc.toFixed(2), vatTotal: +vat.toFixed(2), total: +(sub + vat).toFixed(2),
        items: { create: items }, followups: { create: {} }, events: { create: [{ type: "created", payload: "seed" }] }
      }
    });
  }
  console.log("Seed OK. Login: demo@preventivai.it / demo1234");
}
main().finally(() => prisma.$disconnect());
