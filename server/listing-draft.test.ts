import { describe, expect, it } from "vitest";
import {
  clearListingDraft,
  createEmptyListingForm,
  getNextListingStep,
  listingStepError,
  loadListingDraft,
  saveListingDraft,
} from "../client/src/lib/listingDraft";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe("seller listing drafts", () => {
  it("saves and restores incomplete listing details without persisting browser blob previews", () => {
    const storage = createStorage();
    const form = {
      ...createEmptyListingForm(),
      title: "Sunny Kilimani apartment",
      location: "Kilimani, Nairobi",
      photos: [{ fileKey: "listing/photo-1", url: "https://example.com/photo.jpg", preview: "blob:temporary-preview" }],
    };

    expect(saveListingDraft(storage, 42, form)).toBe(true);
    expect(loadListingDraft(storage, 42)).toMatchObject({
      title: "Sunny Kilimani apartment",
      location: "Kilimani, Nairobi",
      photos: [{ fileKey: "listing/photo-1", preview: "https://example.com/photo.jpg" }],
    });
  });

  it("clears completed drafts and validates each required form step", () => {
    const storage = createStorage();
    const form = createEmptyListingForm();
    expect(listingStepError(form, 0)).toContain("title");
    expect(listingStepError({ ...form, title: "Home", description: "A bright home" }, 1)).toContain("price");
    expect(listingStepError({ ...form, title: "Home", description: "A bright home", price: "120000", location: "Kilimani" }, 1)).toBeNull();
    expect(getNextListingStep({ ...form, title: "Home", description: "A bright home" }, 0)).toEqual({ nextStep: 1, error: null });
    expect(getNextListingStep(form, 0)).toMatchObject({ nextStep: 0 });

    expect(saveListingDraft(storage, 42, form)).toBe(false);
    expect(saveListingDraft(storage, 42, { ...form, title: "Temporary" })).toBe(true);
    clearListingDraft(storage, 42);
    expect(loadListingDraft(storage, 42)).toBeNull();
  });

  it("removes a stale draft when a seller deliberately clears the new listing form", () => {
    const storage = createStorage();
    saveListingDraft(storage, 42, { ...createEmptyListingForm(), title: "Old saved draft" });
    expect(loadListingDraft(storage, 42)?.title).toBe("Old saved draft");

    expect(saveListingDraft(storage, 42, createEmptyListingForm())).toBe(false);
    expect(loadListingDraft(storage, 42)).toBeNull();
  });
});
