import { describe, expect, it } from "vitest";
import { createEmptyListingForm, getListingDraftMetadata, listingDraftKey, loadListingDraft, saveListingDraft } from "../client/src/lib/listingDraft";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

class MemoryStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

describe("platform foundation resilience", () => {
  it("stores a versioned local draft with a timestamp and restores its form safely", () => {
    const storage = new MemoryStorage();
    const form = { ...createEmptyListingForm(), title: "Kilimani apartment", description: "A bright apartment with secure parking.", price: "60000" };
    expect(saveListingDraft(storage, 7, form)).toBe(true);
    const raw = JSON.parse(storage.getItem(listingDraftKey(7))!);
    expect(raw).toMatchObject({ version: 2, form: expect.objectContaining({ title: "Kilimani apartment" }) });
    expect(typeof raw.savedAt).toBe("number");
    expect(loadListingDraft(storage, 7)).toMatchObject({ title: "Kilimani apartment", price: "60000" });
  });

  it("continues to restore legacy draft shapes and reports offline-aware local metadata", () => {
    const storage = new MemoryStorage();
    storage.setItem(listingDraftKey(7), JSON.stringify({ title: "Legacy listing", description: "A valid saved description", photos: [] }));
    expect(loadListingDraft(storage, 7)).toMatchObject({ title: "Legacy listing" });
    expect(getListingDraftMetadata(storage, 7, false)).toEqual({ savedAt: null, mode: "offline" });
    expect(getListingDraftMetadata(storage, 7, true)).toEqual({ savedAt: null, mode: "local" });
  });

  it("ships persisted language foundations and a production-only service-worker registration", () => {
    const languageSource = readFileSync(resolve(process.cwd(), "client/src/contexts/LanguageContext.tsx"), "utf8");
    const entrySource = readFileSync(resolve(process.cwd(), "client/src/main.tsx"), "utf8");
    const workerSource = readFileSync(resolve(process.cwd(), "client/public/sw.js"), "utf8");
    expect(languageSource).toContain('"nav.home": "Nyumbani"');
    expect(languageSource).toContain('"nyumba-360-language"');
    expect(entrySource).toContain('import.meta.env.PROD && "serviceWorker" in navigator');
    expect(workerSource).toContain('const CACHE_NAME = "nyumba-360-shell-v1"');
    expect(workerSource).toContain('event.request.mode === "navigate"');
  });
});
