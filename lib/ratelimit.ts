// Rate limiting semplice in-memory (per istanza). Su serverless conta per-isolato:
// mitiga abusi basilari, per limiti distribuiti usare Redis/Upstash in futuro.
const buckets = new Map<string, { n: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (b.n >= limit) return { ok: false, retryAfter: Math.ceil((b.reset - now) / 1000) };
  b.n++;
  return { ok: true, retryAfter: 0 };
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
