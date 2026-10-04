import { LEGAL } from "@/lib/legal";

export default function Page() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">Cookie Policy</h1>
      <p className="text-slate-500 mt-1">Ultimo aggiornamento: {LEGAL.updated}</p>
      <div className="mt-4 space-y-4">
        <section><h2 className="font-semibold">Cookie tecnici (nessun consenso richiesto)</h2>
          <p><code>pa_session</code> — login, httpOnly, 7 giorni. Necessario per l'area riservata. Nessun cookie di profilazione, nessuna pubblicità, nessun tracking di terze parti.</p></section>
        <section><h2 className="font-semibold">Gestione</h2><p>Puoi bloccare i cookie dal browser, ma il login non funzionerà. Contatti: {LEGAL.email}.</p></section>
      </div>
    </div>
  );
}
