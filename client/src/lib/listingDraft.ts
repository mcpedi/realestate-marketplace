export type ListingPhotoDraft = {
  fileKey: string;
  url: string;
  preview: string;
  is360?: boolean;
};

export type ListingFormDraft = {
  title: string;
  description: string;
  price: string;
  location: string;
  latitude: string;
  longitude: string;
  propertyType: string;
  listingType: string;
  bedrooms: string;
  bathrooms: string;
  landSize: string;
  floorArea: string;
  amenities: string[];
  photos: ListingPhotoDraft[];
};

type StorageLike = Pick<Storage, "getItem" | "removeItem" | "setItem">;
type StoredListingDraft = { version: 2; savedAt: number; form: ListingFormDraft };
export type ListingDraftMetadata = { savedAt: number | null; mode: "offline" | "local" | "none" };

export const LISTING_FORM_STEPS = [
  { label: "Basics", description: "The property essentials" },
  { label: "Location & price", description: "Where and how much" },
  { label: "Details & media", description: "Make the listing stand out" },
] as const;

export const MIN_LISTING_DESCRIPTION_LENGTH = 10;

export function createEmptyListingForm(): ListingFormDraft {
  return {
    title: "",
    description: "",
    price: "",
    location: "",
    latitude: "",
    longitude: "",
    propertyType: "house",
    listingType: "sale",
    bedrooms: "0",
    bathrooms: "0",
    landSize: "",
    floorArea: "",
    amenities: [],
    photos: [],
  };
}

export function listingDraftKey(userId: number): string {
  return `nyumba-360-listing-draft:${userId}`;
}

export function hasListingDraftContent(form: ListingFormDraft): boolean {
  return Boolean(form.title.trim() || form.description.trim() || form.price || form.location || form.photos.length || form.amenities.length);
}

export function saveListingDraft(storage: StorageLike, userId: number, form: ListingFormDraft): boolean {
  if (!hasListingDraftContent(form)) {
    storage.removeItem(listingDraftKey(userId));
    return false;
  }
  const serializableForm: ListingFormDraft = {
    ...form,
    photos: form.photos.map(({ fileKey, url, is360 }) => ({ fileKey, url, preview: url, is360 })),
  };
  const envelope: StoredListingDraft = { version: 2, savedAt: Date.now(), form: serializableForm };
  storage.setItem(listingDraftKey(userId), JSON.stringify(envelope));
  return true;
}

export function loadListingDraft(storage: StorageLike, userId: number): ListingFormDraft | null {
  const stored = storage.getItem(listingDraftKey(userId));
  if (!stored) return null;
  try {
    const raw = JSON.parse(stored) as Partial<ListingFormDraft> | Partial<StoredListingDraft>;
    const parsed: Partial<ListingFormDraft> = "form" in raw && raw.form ? raw.form : raw as Partial<ListingFormDraft>;
    return {
      ...createEmptyListingForm(),
      ...parsed,
      amenities: Array.isArray(parsed.amenities) ? parsed.amenities.filter((item): item is string => typeof item === "string") : [],
      photos: Array.isArray(parsed.photos)
        ? parsed.photos
            .filter((photo): photo is ListingPhotoDraft => Boolean(photo && typeof photo.fileKey === "string" && typeof photo.url === "string"))
            .map((photo) => ({ ...photo, preview: photo.url }))
        : [],
    };
  } catch {
    storage.removeItem(listingDraftKey(userId));
    return null;
  }
}

export function getListingDraftMetadata(storage: StorageLike, userId: number, online: boolean): ListingDraftMetadata {
  const stored = storage.getItem(listingDraftKey(userId));
  if (!stored) return { savedAt: null, mode: "none" };
  try {
    const raw = JSON.parse(stored) as Partial<StoredListingDraft>;
    return { savedAt: typeof raw.savedAt === "number" ? raw.savedAt : null, mode: online ? "local" : "offline" };
  } catch {
    return { savedAt: null, mode: "none" };
  }
}

export function clearListingDraft(storage: StorageLike, userId: number): void {
  storage.removeItem(listingDraftKey(userId));
}

export function listingStepError(form: ListingFormDraft, step: number): string | null {
  if (step === 0) {
    if (!form.title.trim()) return "Add a clear property title before continuing.";
    if (form.description.trim().length < MIN_LISTING_DESCRIPTION_LENGTH) {
      return `Add at least ${MIN_LISTING_DESCRIPTION_LENGTH} characters to the property description before continuing.`;
    }
  }
  if (step === 1) {
    if (!Number.isFinite(Number(form.price)) || Number(form.price) <= 0) return "Enter a valid asking price before continuing.";
    if (!form.location.trim()) return "Choose or enter the property location before continuing.";
  }
  return null;
}

export function getNextListingStep(form: ListingFormDraft, currentStep: number): { nextStep: number; error: string | null } {
  const error = listingStepError(form, currentStep);
  return { nextStep: error ? currentStep : Math.min(currentStep + 1, LISTING_FORM_STEPS.length - 1), error };
}
