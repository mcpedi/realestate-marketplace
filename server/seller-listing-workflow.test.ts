import { describe, expect, it } from "vitest";
import { createEmptyListingForm } from "../client/src/lib/listingDraft";
import { applySuggestedLocation, advanceSellerListingWorkflow } from "../client/src/lib/sellerWorkflow";

describe("seller listing workflow enhancements", () => {
  it("keeps a seller on the current step until its required information is complete", () => {
    const incomplete = createEmptyListingForm();
    expect(advanceSellerListingWorkflow(incomplete, 0)).toMatchObject({ nextStep: 0, error: expect.any(String) });

    const shortDescription = { ...incomplete, title: "Modern apartment", description: "Too short" };
    expect(advanceSellerListingWorkflow(shortDescription, 0)).toMatchObject({ nextStep: 0, error: "Add at least 10 characters to the property description before continuing." });

    const basicsComplete = { ...incomplete, title: "Modern apartment", description: "A bright apartment near key amenities." };
    expect(advanceSellerListingWorkflow(basicsComplete, 0)).toEqual({ nextStep: 1, error: null });

    expect(advanceSellerListingWorkflow(basicsComplete, 1)).toMatchObject({ nextStep: 1, error: expect.any(String) });
    expect(advanceSellerListingWorkflow({ ...basicsComplete, price: "25000", location: "Kilimani, Nairobi" }, 1)).toEqual({ nextStep: 2, error: null });
  });

  it("populates the form fields when a location suggestion is selected", () => {
    const selection = { location: "Kilimani, Nairobi, Kenya", latitude: "-1.2921", longitude: "36.783" };
    expect(applySuggestedLocation(createEmptyListingForm(), selection)).toMatchObject(selection);
  });
});
