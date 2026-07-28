import { useState } from "react";
import { Search, MapPin, Home as HomeIcon, DollarSign, Bed, Bath } from "lucide-react";
import { useLocation } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PropertySearchProps {
  compact?: boolean;
  onSearch?: (params: Record<string, string>) => void;
}

export function PropertySearch({ compact, onSearch }: PropertySearchProps) {
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [listingType, setListingType] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [bedrooms, setBedrooms] = useState("all");
  const [, navigate] = useLocation();

  const handleSearch = () => {
    const params: Record<string, string> = {};
    if (location) params.location = location;
    if (propertyType !== "all") params.propertyType = propertyType;
    if (listingType !== "all") params.listingType = listingType;
    if (priceRange !== "all") params.priceRange = priceRange;
    if (bedrooms !== "all") params.bedrooms = bedrooms;
    if (onSearch) {
      onSearch(params);
    } else {
      const query = new URLSearchParams(params).toString();
      navigate(`/properties?${query}`);
    }
  };

  return (
    <div className={`${compact ? "w-full" : "w-full max-w-4xl mx-auto"}`}>
      <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 border border-border/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Location */}
          <div className={`${compact ? "sm:col-span-2 lg:col-span-2" : "sm:col-span-2 lg:col-span-2"}`}>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Location</label>
            <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2.5 bg-background">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Enter location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>

          {/* Property Type */}
          <div className="sm:col-span-1 lg:col-span-1">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger className="h-10 border-border">
                <HomeIcon className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="townhouse">Townhouse</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
                <SelectItem value="penthouse">Penthouse</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="land">Land</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Listing Type */}
          <div className="sm:col-span-1 lg:col-span-1">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
            <Select value={listingType} onValueChange={setListingType}>
              <SelectTrigger className="h-10 border-border">
                <SelectValue placeholder="Buy/Rent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Buy & Rent</SelectItem>
                <SelectItem value="sale">For Sale</SelectItem>
                <SelectItem value="rent">For Rent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div className="sm:col-span-1 lg:col-span-1">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Price</label>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="h-10 border-border">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Any Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Price</SelectItem>
                <SelectItem value="0-5000">Under 5K</SelectItem>
                <SelectItem value="5000-25000">5K - 25K</SelectItem>
                <SelectItem value="25000-100000">25K - 100K</SelectItem>
                <SelectItem value="100000-500000">100K - 500K</SelectItem>
                <SelectItem value="500000-999999999">500K+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Button */}
          <div className={`${compact ? "sm:col-span-1 lg:col-span-1" : "sm:col-span-2 lg:col-span-1"} flex items-end`}>
            <button
              onClick={handleSearch}
              className="w-full h-10 bg-[oklch(0.45_0.18_260)] hover:bg-[oklch(0.38_0.18_260)] text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.97]"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>

        {!compact && (
          <div className="mt-3 flex items-center gap-3 pt-3 border-t border-border/50">
            <span className="text-xs text-muted-foreground">Bedrooms:</span>
            <Select value={bedrooms} onValueChange={setBedrooms}>
              <SelectTrigger className="h-8 w-24 border-border text-xs">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
                <SelectItem value="5">5+</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">Bathrooms:</span>
            <Select value={bedrooms} onValueChange={() => {}}>
              <SelectTrigger className="h-8 w-24 border-border text-xs">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
