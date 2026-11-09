import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dbSource = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
const drizzleConfig = readFileSync(resolve(process.cwd(), "drizzle.config.ts"), "utf8");
const envSource = readFileSync(resolve(process.cwd(), "server/_core/env.ts"), "utf8");

describe("database runtime contract", () => {
  it("keeps the application database adapter aligned with the PostgreSQL schema", () => {
    expect(dbSource).toContain('from "@neondatabase/serverless"');
    expect(dbSource).toContain('from "drizzle-orm/neon-http"');
    expect(dbSource).not.toContain('from "drizzle-orm/mysql2"');
    expect(drizzleConfig).toContain('dialect: "postgresql"');
  });

  it("documents the required connection-string protocol in the database configuration", () => {
    expect(drizzleConfig).toContain("process.env.DATABASE_URL");
    expect(drizzleConfig).toContain("process.env.SUPABASE_DATABASE_URL");
    expect(envSource).toContain("process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL");
  });
});
