export type LocationSelection = {
  location: string;
  latitude: string;
  longitude: string;
};

export function createLocationSelection(location: string, latitude: number, longitude: number): LocationSelection {
  return { location, latitude: String(latitude), longitude: String(longitude) };
}
