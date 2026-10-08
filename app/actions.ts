"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";

const emailSchema = z.string().trim().toLowerCase().email().max(254);

function checkRate(action: string, limit: number, windowMs: number, failUrl: string) {
  const ip = headers().get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(`auth:${action}:${ip}`, limit, windowMs);
  if (!rl.ok) redirect(`${failUrl}?err=Troppe+richieste.+Riprova+tra+${rl.retryAfter}+secondi`);
}

export async function register(form: FormData) {
  checkRate("register", 5, 60000, "/registrati");
  const parsed = z.object({
    name: z.string().trim().min(1).max(100),
    email: emailSchema,
    password: z.string().min(8).max(128),
    businessName: z.string().trim().min(1).max(150),
    piva: z.string().trim().max(20).optional(),
    terms: z.literal("on", { errorMap: () => ({ message: "Devi accettare Termini e Privacy" }) }),
    adult: z.literal("on", { errorMap: () => ({ message: "Devi avere almeno 18 anni" }) })
  }).safeParse({
    name: String(form.get("name") || ""), email: String(form.get("email") || ""),
    password: String(form.get("password") || ""), businessName: String(form.get("businessName") || ""),
    piva: String(form.get("piva") || ""), terms: String(form.get("terms") || ""), adult: String(form.get("adult") || "")
  });
  if (!parsed.success) redirect("/registrati?err=Devi+accettare+Termini,+Privacy+ed+eta+18+");
  const { name, email, password, businessName } = parsed.data;
  const piva = parsed.data.piva?.trim() || null;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) redirect("/registrati?err=Email+gia+registrata");
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, passwordHash, businessName, piva, acceptedTermsAt: new Date() } });
  await prisma.company.create({ data: { userId: user.id, name: businessName, piva, email } });
  await prisma.subscription.create({ data: { userId: user.id, plan: "FREE" } });
  await createSession(user.id);
  redirect("/onboarding");
}

export async function login(form: FormData) {
  checkRate("login", 10, 60000, "/login");
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) redirect("/login?err=Credenziali+non+valide");
  await createSession(user.id);
  const company = await prisma.company.findUnique({ where: { userId: user.id } });
  redirect(company?.onboarded ? "/dashboard" : "/onboarding");
}

export async function requestReset(form: FormData) {
  checkRate("reset", 3, 60000, "/recupero");
  const raw = String(form.get("email") || "").trim().toLowerCase();
  if (!emailSchema.safeParse(raw).success) redirect("/recupero?ok=1");
  const email = raw;
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const { randomBytes } = await import("crypto");
    const token = randomBytes(32).toString("hex");
    await prisma.passwordReset.deleteMany({ where: { email } });
    await prisma.passwordReset.create({ data: { email, token, expiresAt: new Date(Date.now() + 3600e3) } });
    // TODO: inviare email con link ${process.env.APP_URL}/reset/${token} quando SMTP attivo
    console.log(`[reset] ${email} -> /reset/${token}`);
  }
  redirect("/recupero?ok=1");
}

export async function confirmReset(form: FormData) {
  "use server";
  const { redirect: red } = await import("next/navigation");
  const token = String(form.get("token") || "");
  const password = String(form.get("password") || "");
  if (password.length < 8) red(`/reset/${token}?err=Password+minimo+8+caratteri`);
  const { prisma: db } = await import("@/lib/db");
  const pr = await db.passwordReset.findUnique({ where: { token } });
  if (!pr || pr.expiresAt < new Date()) red("/recupero?err=Link+scaduto+o+non+valido");
  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.update({ where: { email: pr!.email }, data: { passwordHash } });
  await db.passwordReset.delete({ where: { token } });
  red("/login?ok=Password+aggiornata.+Accedi.");
}
