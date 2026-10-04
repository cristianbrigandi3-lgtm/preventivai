"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function register(form: FormData) {
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const businessName = String(form.get("businessName") || "").trim();
  const piva = String(form.get("piva") || "").trim() || null;
  if (!name || !email || !password || !businessName) redirect("/registrati?err=Campi+obbligatori+mancanti");
  if (password.length < 8) redirect("/registrati?err=Password+minimo+8+caratteri");
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) redirect("/registrati?err=Email+gia+registrata");
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, passwordHash, businessName, piva } });
  await prisma.company.create({ data: { userId: user.id, name: businessName, piva, email } });
  await prisma.subscription.create({ data: { userId: user.id, plan: "FREE" } });
  await createSession(user.id);
  redirect("/onboarding");
}

export async function login(form: FormData) {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) redirect("/login?err=Credenziali+non+valide");
  await createSession(user.id);
  const company = await prisma.company.findUnique({ where: { userId: user.id } });
  redirect(company?.onboarded ? "/dashboard" : "/onboarding");
}

export async function requestReset(form: FormData) {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    await prisma.passwordReset.create({ data: { email, token, expiresAt: new Date(Date.now() + 3600e3) } });
  }
  redirect("/recupero?ok=1");
}
