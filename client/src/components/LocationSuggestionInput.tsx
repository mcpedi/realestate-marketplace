import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { loadGoogleMapsScript } from "@/components/Map";
import { createLocationSelection, type LocationSelection } from "@/lib/locationSelection";

export function LocationSuggestionInput({ value, onChange, onSelect }: { value: string; onChange: (value: string) => void; onSelect: (location: LocationSelection) => void }) {
  const [ready, setReady] = useState(false);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);

  useEffect(() => {
    let active = true;
    loadGoogleMapsScript().then(() => {
      if (active && window.google?.maps?.places) {
        serviceRef.current = new window.google.maps.places.AutocompleteService();
        setReady(true);
      }
    }).catch(() => active && setReady(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!ready || value.trim().length < 3 || !serviceRef.current) {
      setSuggestions([]);
      return;
    }
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      serviceRef.current?.getPlacePredictions({ input: value, componentRestrictions: { country: "ke" }, types: ["geocode"] }, (results) => {
        setSuggestions(results ?? []);
        setIsLoading(false);
      });
    }, 280);
    return () => window.clearTimeout(timer);
  }, [ready, value]);

  const selectSuggestion = (suggestion: google.maps.places.AutocompletePrediction) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ placeId: suggestion.place_id }, (results, status) => {
      const result = status === "OK" ? results?.[0] : undefined;
      if (!result) return;
      const coordinates = result.geometry.location;
      onSelect(createLocationSelection(result.formatted_address, coordinates.lat(), coordinates.lng()));
      setSuggestions([]);
    });
  };

  return <div className="relative">
    <label className="mb-1 block text-sm font-medium">Location *</label>
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
      <Input required value={value} onChange={(event) => onChange(event.target.value)} placeholder="Start typing an address or estate" className="h-11 rounded-xl border-slate-200 pl-9 pr-9" autoComplete="off" />
      {isLoading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />}
    </div>
    <p className="mt-1.5 text-xs text-slate-500">Suggestions are limited to Kenya and can fill in coordinates automatically.</p>
    {suggestions.length > 0 && <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
      {suggestions.slice(0, 5).map((suggestion) => <button type="button" key={suggestion.place_id} onClick={() => selectSuggestion(suggestion)} className="flex w-full items-start gap-2 px-3 py-3 text-left text-sm transition hover:bg-emerald-50">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>{suggestion.description}</span>
      </button>)}
    </div>}
  </div>;
}
