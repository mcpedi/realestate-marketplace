import { neon } from "@neondatabase/serverless";
import { describe, expect, it } from "vitest";

describe("configured PostgreSQL connection", () => {
  it("answers a lightweight connectivity query with the supplied database secret", async () => {
    const connectionString = process.env.SUPABASE_DATABASE_URL;
    if (!connectionString) {
      throw new Error("SUPABASE_DATABASE_URL is required for the connectivity check");
    }
    expect(connectionString).toMatch(/^postgres(?:ql)?:\/\//);
    const sql = neon(connectionString);
    const result = await sql`select 1 as ok`;
    expect(Number(result[0]?.ok)).toBe(1);
  }, 15_000);

  it("connects to a database containing the Nyumba 360 properties table", async () => {
    const connectionString = process.env.SUPABASE_DATABASE_URL;
    if (!connectionString) {
      throw new Error("SUPABASE_DATABASE_URL is required for the schema check");
    }
    const sql = neon(connectionString);
    const rows = await sql`
      select 1 as present
      from information_schema.tables
      where table_schema = 'public' and table_name = 'properties'
      limit 1
    `;
    expect(rows).toHaveLength(1);
    expect(Number(rows[0]?.present)).toBe(1);
  }, 15_000);
});
