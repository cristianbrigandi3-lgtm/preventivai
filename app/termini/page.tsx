import { LEGAL } from "@/lib/legal";

export default function Page() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">Termini di Servizio</h1>
      <p className="text-slate-500 mt-1">Ultimo aggiornamento: {LEGAL.updated}</p>
      <div className="mt-4 space-y-4">
        <section><h2 className="font-semibold">1. Servizio</h2>
          <p>PreventivAI ({LEGAL.owner}) fornisce software per creare, inviare e gestire preventivi. Piani: FREE (5 preventivi/mese), PRO, BUSINESS come da pagina prezzi.</p></section>
        <section><h2 className="font-semibold">2. Account</h2>
          <p>L'utente è responsabile di credenziali e contenuti inseriti (dati clienti, preventivi). Vietato uso illecito, spam o violazione di dati altrui. Possiamo sospendere account abusivi.</p></section>
        <section><h2 className="font-semibold">3. Pagamenti</h2>
          <p>Piani a pagamento via Stripe: addebito anticipato, rinnovo automatico, disdetta con effetto a fine periodo. Rimborso entro 14 giorni per consumatori (diritto di recesso), salvo uso integrale del servizio digitale.</p></section>
        <section><h2 className="font-semibold">4. Disponibilità e responsabilità</h2>
          <p>Obiettivo 99% uptime, nessuna garanzia assoluta. Il servizio non sostituisce consulenza fiscale/legale: l'utente resta responsabile dei contenuti dei preventivi. Responsabilità limitata al canone pagato negli ultimi 12 mesi.</p></section>
        <section><h2 className="font-semibold">5. Proprietà</h2><p>I dati inseriti restano dell'utente ed esportabili (PDF). Il software resta di {LEGAL.owner}.</p></section>
        <section><h2 className="font-semibold">6. Recesso e cancellazione</h2><p>L'utente può cancellare l'account scrivendo a {LEGAL.email}: dati eliminati entro 30 giorni.</p></section>
        <section><h2 className="font-semibold">7. Legge e foro</h2><p>Legge italiana. Foro del consumatore se applicabile, altrimenti foro del titolare.</p></section>
      </div>
    </div>
  );
}
