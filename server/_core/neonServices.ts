import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { ENV } from "./env";

type ServiceStatus = "ok" | "not_configured" | "unavailable";

export async function getNeonServiceStatus() {
  const db = await getDb();
  let postgres: ServiceStatus = "not_configured";
  if (db) {
    try {
      await db.execute(sql`select 1`);
      postgres = "ok";
    } catch (error) {
      console.error("[Neon] Postgres health check failed:", error);
      postgres = "unavailable";
    }
  }

  const auth = await checkHttpService(ENV.neonAuthJwksUrl);
  const realtime = await checkHttpService(ENV.neonRealtimeUrl.replace(/^wss:/, "https:"));

  return {
    postgres,
    auth,
    realtime,
    ready: postgres === "ok" && auth === "ok" && realtime === "ok",
  };
}

async function checkHttpService(url: string): Promise<ServiceStatus> {
  if (!url) return "not_configured";
  try {
    const response = await fetch(url, { method: "GET", signal: AbortSignal.timeout(5000) });
    return response.status < 500 ? "ok" : "unavailable";
  } catch (error) {
    console.error("[Neon] Service health check failed:", error);
    return "unavailable";
  }
}
