import { getNextListingStep, type ListingFormDraft } from "@/lib/listingDraft";
import type { LocationSelection } from "@/lib/locationSelection";

export function advanceSellerListingWorkflow(form: ListingFormDraft, currentStep: number) {
  return getNextListingStep(form, currentStep);
}

export function applySuggestedLocation(form: ListingFormDraft, selection: LocationSelection): ListingFormDraft {
  return {
    ...form,
    location: selection.location,
    latitude: selection.latitude,
    longitude: selection.longitude,
  };
}
