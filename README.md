# PreventivAI — Fase 1 MVP

## Avvio
export PATH=/tmp/opencode/node/node-v22.17.0-linux-x64/bin:$PATH
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev  # http://localhost:3000

## Demo
demo@preventivai.it / demo1234

## Fase 2 — invio email, stati, pagina pubblica
- Dettaglio preventivo: form "Invia via email" (POST `/api/quotes/[id]/send`, template IT + PDF allegato, EmailLog, Bozza→Inviato), storico email/eventi, bottoni stato (Inviato/Accettato/Scaduto), WhatsApp, duplicazione.
- Senza SMTP in `.env` l'invio è registrato come `logged-no-smtp`. Con SMTP configurato spedisce davvero (nodemailer).
- Pagina pubblica `/p/[token]`: token 24 hex non enumerabile, Inviato→Visualizzato all'apertura con ipHash+UA, form accetta/rifiuta con consenso, conferma, PDF pubblico `/api/p/[token]/pdf`.
- Cron scadenze: GET `/api/cron/expire` (opz. `?secret=` con CRON_SECRET).

## Fase 3 — follow-up, statistiche, subscription
- Follow-up: default globali in `Company` (impostazioni) + override per preventivo (card nel dettaglio, PUT `/api/quotes/[id]/followup`).
  Cron GET `/api/cron/followups` invia reminder 1/2 via email (o log senza SMTP), idempotente via `sent1/sent2`. Schedulare ogni giorno con `?secret=` se CRON_SECRET impostato.
- Nota: le route cron sono `force-dynamic` (le GET statiche verrebbero cachate alla build).
- Statistiche: `/statistiche` (fatturato potenziale, conversione, valore medio, per-mese, top clienti).
- Abbonamento: `/abbonamento` + checkout Stripe `/api/billing/checkout?plan=PRO|BUSINESS` (501 istruttivo senza chiavi) + webhook `/api/billing/webhook` che aggiorna `Subscription`.

## Deploy produzione
1. **DB**: `docker compose up -d db` oppure Postgres managed. Cambia `provider` in `postgresql` in `prisma/schema.prisma`, imposta `DATABASE_URL`, poi `npx prisma db push`.
2. **Docker**: `DB_PASSWORD=... JWT_SECRET=... APP_URL=https://tuodominio.it docker compose up -d --build`.
3. **Vercel**: importa il repo, imposta le env (DB Postgres es. Neon/Supabase, JWT_SECRET, APP_URL, SMTP_*, CRON_SECRET, STRIPE_*). I cron in `vercel.json` girano da soli (Vercel manda Bearer CRON_SECRET in automatico).
4. **Stripe**: crea prodotti PRO/BUSINESS, copia i Price ID nelle env, imposta webhook `https://tuodominio.it/api/billing/webhook`.

## Note
- DB dev: SQLite (`DATABASE_URL="file:./dev.db"`). Produzione: cambiare provider in `postgresql` e puntare a Postgres, poi `prisma db push`.
- Auth: JWT HS256 in cookie httpOnly, bcrypt, reset con token.
- Rotte: `/` landing, `/login`, `/registrati`, `/recupero`, `/onboarding`, `/dashboard`, `/clienti`, `/preventivi/nuovo`, `/preventivi/[id]`, `/p/[token]`, `/impostazioni`, `/api/quotes`, `/api/quotes/[id]/pdf`, `/api/quotes/[id]/duplicate`.
- Fase 2 da completare: invio email reale (ora solo EmailLog schema), reminder schedulati, accettazione con firma. Base già presente (pagina pubblica, status, WhatsApp, PDF).
