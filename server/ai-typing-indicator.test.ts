import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const assistantSource = readFileSync(resolve(process.cwd(), "client/src/pages/AIAssistant.tsx"), "utf8");

describe("Nyumba 360 AI typing indicator", () => {
  it("uses an accessible live status with a motion-aware three-dot indicator", () => {
    expect(assistantSource).toContain('role="status"');
    expect(assistantSource).toContain('aria-live="polite"');
    expect(assistantSource).toContain("Nyumba 360 AI is typing");
    expect(assistantSource).toContain("[0, 1, 2].map");
    expect(assistantSource).toContain("motion-reduce:animate-none");
  });
});
