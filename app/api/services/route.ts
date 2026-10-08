import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function GET(req: Request) {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const company = await prisma.company.findUnique({ where: { userId: uid } });
  if (!company) return NextResponse.json({ services: [] });
  const q = new URL(req.url).searchParams.get("q") || "";
  const services = await prisma.service.findMany({
    where: { companyId: company.id, deletedAt: null, ...(q ? { name: { contains: q, mode: "insensitive" } } : {}) },
    orderBy: [{ useCount: "desc" }, { name: "asc" }], take: 20
  });
  return NextResponse.json({ services });
}
