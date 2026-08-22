import { describe, expect, it } from "vitest";
import { createLocationSelection } from "../client/src/lib/locationSelection";

describe("listing location selection", () => {
  it("converts a selected place address and coordinates into form-ready values", () => {
    expect(createLocationSelection("Kilimani, Nairobi, Kenya", -1.2921, 36.783)).toEqual({
      location: "Kilimani, Nairobi, Kenya",
      latitude: "-1.2921",
      longitude: "36.783",
    });
  });
});
