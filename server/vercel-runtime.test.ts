import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const entrypoint = readFileSync(resolve(process.cwd(), "server/_core/index.ts"), "utf8");
const staticServer = readFileSync(resolve(process.cwd(), "server/_core/static.ts"), "utf8");

describe("Vercel production runtime entrypoint", () => {
  it("keeps the Vite development toolchain out of the eager production imports", () => {
    expect(entrypoint).not.toContain('import { setupVite } from "./vite"');
    expect(entrypoint).toContain('await import("./vite")');
    expect(entrypoint).toContain('import { serveStatic } from "./static"');
  });

  it("serves the built SPA from a Vite-independent module", () => {
    expect(staticServer).toContain('import express, { type Express } from "express"');
    expect(staticServer).toContain('path.join(distPath, "client", "index.html")');
    expect(staticServer).toContain("app.use(express.static(distPath))");
  });
});
