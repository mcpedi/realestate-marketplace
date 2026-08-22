import { describe, expect, it } from "vitest";
import { createEmptyListingForm, listingStepError, MIN_LISTING_DESCRIPTION_LENGTH } from "../client/src/lib/listingDraft";

describe("listing description validation", () => {
  it("matches the server minimum before allowing the seller to leave the basics step", () => {
    const form = createEmptyListingForm();
    expect(MIN_LISTING_DESCRIPTION_LENGTH).toBe(10);
    expect(listingStepError({ ...form, title: "Kilimani apartment", description: "Too short" }, 0)).toContain("at least 10 characters");
    expect(listingStepError({ ...form, title: "Kilimani apartment", description: "Bright two-bedroom apartment" }, 0)).toBeNull();
  });
});
