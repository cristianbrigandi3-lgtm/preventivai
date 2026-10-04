import { LEGAL } from "@/lib/legal";

export default function Page() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p className="text-slate-500 mt-1">Ultimo aggiornamento: {LEGAL.updated}</p>
      <div className="mt-4 space-y-4">
        <section><h2 className="font-semibold">1. Titolare del trattamento</h2>
          <p>{LEGAL.owner}, P.IVA {LEGAL.piva}, email {LEGAL.email}.</p></section>
        <section><h2 className="font-semibold">2. Dati raccolti</h2>
          <p>Account: nome, email, password (solo hash bcrypt, mai in chiaro), nome attività, P.IVA. Dati azienda inseriti in onboarding. Clienti e preventivi inseriti dall'utente. Log tecnici: visualizzazioni pagina pubblica (hash IP anonimo + user agent), eventi e invii email.</p></section>
        <section><h2 className="font-semibold">3. Finalità e basi giuridiche</h2>
          <p>Erogazione del servizio (art. 6.1.b GDPR — esecuzione del contratto). Log di sicurezza e prevenzione abusi (art. 6.1.f — legittimo interesse). Email di servizio (preventivi, reminder) legate al contratto.</p></section>
        <section><h2 className="font-semibold">4. Conservazione</h2>
          <p>Dati conservati finché l'account è attivo. Alla cancellazione, dati personali eliminati o anonimizzati entro 30 giorni; log di sicurezza fino a 12 mesi. Soft-delete: i record eliminati non sono più visibili nell'app.</p></section>
        <section><h2 className="font-semibold">5. Responsabili e sub-responsabili</h2>
          <p>Hosting: Vercel Inc. (USA — con clausole standard UE). Database: Neon (UE, Francoforte). Email: provider SMTP configurato dal titolare. Pagamenti: Stripe (solo se attivato).</p></section>
        <section><h2 className="font-semibold">6. Diritti dell'interessato</h2>
          <p>Accesso, rettifica, cancellazione, limitazione, portabilità, opposizione: scrivi a {LEGAL.email}. Reclamo al Garante Privacy (garanteprivacy.it).</p></section>
        <section><h2 className="font-semibold">7. Minori</h2><p>Servizio rivolto a professionisti maggiorenni.</p></section>
        <section><h2 className="font-semibold">8. Modifiche</h2><p>Versione aggiornata sempre a /privacy con data di revisione.</p></section>
      </div>
    </div>
  );
}
