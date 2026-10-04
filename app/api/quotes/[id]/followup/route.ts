import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const rl = rateLimit(`followup:${clientIp(req)}`, 20, 60000);
  if (!rl.ok) return NextResponse.json({ error: "Troppe richieste" }, { status: 429 });
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const q = await prisma.quote.findFirst({ where: { id: params.id }, include: { company: true } });
  if (!q || q.company.userId !== uid) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const b = await req.json();
  const data = {
    enabled: !!b.enabled,
    day1: Math.max(1, Number(b.day1) || 2),
    day2: Math.max(1, Number(b.day2) || 5),
    text1: String(b.text1 || "") || null,
    text2: String(b.text2 || "") || null
  };
  await prisma.followUp.upsert({ where: { quoteId: q.id }, create: { quoteId: q.id, ...data }, update: data });
  return NextResponse.json({ ok: true });
}
