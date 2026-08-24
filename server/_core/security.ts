import type { NextFunction, Request, Response } from "express";

type RateLimitWindow = { count: number; resetAt: number };

const rateLimitWindows = new Map<string, RateLimitWindow>();
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanupAt = 0;

function cleanExpiredRateLimitWindows(now: number) {
  if (now - lastCleanupAt < RATE_LIMIT_CLEANUP_INTERVAL_MS) return;
  lastCleanupAt = now;
  rateLimitWindows.forEach((window, key) => {
    if (window.resetAt <= now) rateLimitWindows.delete(key);
  });
}

export function getClientAddress(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  return (value?.trim() || req.ip || req.socket?.remoteAddress || "unknown").slice(0, 128);
}

function maskClientAddress(address: string) {
  if (address.includes(":")) return "ipv6";
  const parts = address.split(".");
  return parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.0` : "unknown";
}

export function logSecurityEvent(event: string, req: Request, details: Record<string, unknown> = {}) {
  console.warn(
    JSON.stringify({
      type: "security_event",
      event,
      method: req.method,
      path: req.path,
      client: maskClientAddress(getClientAddress(req)),
      at: new Date().toISOString(),
      ...details,
    }),
  );
}

export function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  cleanExpiredRateLimitWindows(now);
  const existing = rateLimitWindows.get(key);
  if (!existing || existing.resetAt <= now) {
    rateLimitWindows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }
  existing.count += 1;
  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

export function enforceRequestRateLimit(req: Request, res: Response, next: NextFunction) {
  const result = consumeRateLimit(`trpc:${getClientAddress(req)}`, 240, 10 * 60 * 1000);
  res.setHeader("RateLimit-Limit", "240");
  res.setHeader("RateLimit-Remaining", String(result.remaining));
  if (result.allowed) return next();
  res.setHeader("Retry-After", String(result.retryAfterSeconds));
  logSecurityEvent("rate_limit.blocked", req, { scope: "api" });
  res.status(429).json({ error: "Too many requests. Please try again shortly." });
}

function expectedRequestOrigin(req: Request) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto?.split(",")[0])?.trim() || req.protocol;
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost?.split(",")[0])?.trim() || req.get("host");
  return host ? `${protocol}://${host}` : undefined;
}

export function enforceSameOriginForMutations(req: Request, res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("origin");
  if (!origin) return next(); // Non-browser clients rely on the HttpOnly cookie policy.
  const expected = expectedRequestOrigin(req);
  if (expected && origin === expected) return next();
  logSecurityEvent("csrf_origin.blocked", req, { originPresent: true });
  res.status(403).json({ error: "Cross-origin request blocked" });
}

export function applySecurityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self), payment=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader(
    "Content-Security-Policy-Report-Only",
    "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; object-src 'none'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https: wss:; media-src 'self' blob: https:; worker-src 'self' blob:",
  );
  next();
}
