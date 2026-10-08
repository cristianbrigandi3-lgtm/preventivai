import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <span className="font-bold text-indigo-700 text-lg">PreventivAI</span>
        <div className="flex gap-3">
          <Link href="/login" className="text-sm text-slate-600 px-3 py-2">Accedi</Link>
          <Link href="/registrati" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold">Crea il tuo primo preventivo</Link>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Fai preventivi professionali in pochi minuti. Fatti dire sì più velocemente.</h1>
        <p className="mt-4 text-lg text-slate-600">Crea, invia e monitora i tuoi preventivi da un unico posto. Pensato per elettricisti, idraulici, installatori, imbianchini e piccole imprese.</p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link href="/registrati" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold">Crea il tuo primo preventivo</Link>
          <Link href="#come" className="border px-6 py-3 rounded-xl">Scopri come funziona</Link>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-10 grid md:grid-cols-3 gap-4" id="come">
        {[["Il problema", "Excel e Word rubano tempo, i PDF sembrano improvvisati, i clienti non rispondono."],
          ["Come funziona", "1. Inserisci cliente e voci. 2. Anteprima live. 3. PDF, email e WhatsApp in un clic."],
          ["Funzionalità", "PDF professionale, link pubblico, accettazione online, follow-up automatici, clienti, statistiche."]].map(([t, d]) => (
          <div key={t} className="rounded-2xl border p-5 bg-slate-50"><h3 className="font-semibold">{t}</h3><p className="text-sm text-slate-600 mt-2">{d}</p></div>
        ))}
      </section>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-2xl font-bold">Esempio di preventivo</h2>
        <div className="mt-4 rounded-2xl border p-5 text-sm">
          <p className="font-semibold">Preventivo 2026-001 — Impianto elettrico appartamento</p>
          <p className="text-slate-600">Quadro + 40 punti luce + certificazione — Totale € 4.850,00 + IVA</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-10 grid md:grid-cols-3 gap-4">
        {[["FREE €0", "5 preventivi/mese, template base"], ["PRO €12/mese", "Illimitati, logo, follow-up, email, statistiche"], ["BUSINESS €29/mese", "Tutto PRO + multi-utente e personalizzazione"]].map(([t, d]) => (
          <div key={t} className="rounded-2xl border p-5"><h3 className="font-bold">{t}</h3><p className="text-sm text-slate-600 mt-2">{d}</p></div>
        ))}
      </section>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-2xl font-bold">FAQ</h2>
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          <p><b>Serve installare qualcosa?</b> No, tutto nel browser, anche da smartphone.</p>
          <p><b>Posso usare il mio logo?</b> Sì, dal piano PRO in PDF e pagina pubblica.</p>
          <p><b>Il cliente deve registrarsi?</b> No, apre il link e accetta in un clic.</p>
        </div>
        <div className="mt-8 text-center">
          <Link href="/registrati" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold">Inizia gratis ora</Link>
        </div>
      </section>
      <footer className="border-t mt-10">
        <div className="mx-auto max-w-6xl px-4 py-6 flex flex-wrap gap-4 text-sm text-slate-500">
          <span>© 2026 PreventivAI</span>
          <Link href="/privacy">Privacy</Link>
          <Link href="/termini">Termini</Link>
          <Link href="/cookie">Cookie</Link>
        </div>
      </footer>
    </div>
  );
}
