import { Link } from "wouter";
import { Bed, Bath, Maximize, MapPin, Heart, Tag, BadgeCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import type { Property } from "../../../drizzle/schema";

interface PropertyCardProps {
  property: Property & { photos?: { url: string }[] };
}

function usePremiumSellerBadge(userId?: number | null) {
  // Stabilize the userId reference so the query doesn't refetch on every render.
  // A fresh userId only when it actually changes.
  const stableUserId = useMemo(() => userId ?? -1, [userId ?? -1]);
  const { data } = trpc.subscription.isPremium.useQuery(undefined, {
    enabled: stableUserId !== -1,
  });
  return data?.isPremium || false;
}

function PremiumBadge() {
  return (
    <span className="px-2.5 py-1 rounded-md text-xs font-semibold text-white bg-[oklch(0.72_0.15_80)] inline-flex items-center gap-1">
      <BadgeCheck className="w-3 h-3" />
      Verified
    </span>
  );
}

export function PropertyCard({ property }: PropertyCardProps) {
  const [isFav, setIsFav] = useState(false);
  const toggleFav = trpc.favorite.toggle.useMutation({
    onSuccess: (data) => {
      setIsFav(data.isFavorite);
      toast.success(data.isFavorite ? "Added to favorites" : "Removed from favorites");
    },
    onError: () => {
      toast.error("Please sign in to save favorites");
    },
  });

  // Premium sellers get a "Verified" badge on their listings
  const isVerifiedSeller = usePremiumSellerBadge(property.userId);

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `Ksh ${Math.round(price / 1000000).toLocaleString()}M`;
    if (price >= 1000) return `Ksh ${Math.round(price / 1000).toLocaleString()}K`;
    return `Ksh ${price.toLocaleString()}`;
  };

  const firstPhoto = property.photos?.[0]?.url || "/placeholder-property.jpg";

  return (
    <div className="group bg-white rounded-xl overflow-hidden border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300">
      {/* Image */}
      <Link href={`/property/${property.id}`} className="block relative overflow-hidden aspect-[4/3]">
        <img
          src={firstPhoto}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-semibold text-white ${
              property.listingType === "sale"
                ? "bg-[oklch(0.45_0.18_260)]"
                : "bg-[oklch(0.72_0.15_80)]"
            }`}
          >
            For {property.listingType === "sale" ? "Sale" : "Rent"}
          </span>
          {property.featured && (
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold text-white bg-[oklch(0.45_0.18_260)]">
              Featured
            </span>
          )}
          {isVerifiedSeller && <PremiumBadge />}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFav.mutate(property.id);
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
        >
          <Heart
            className={`w-4 h-4 ${isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
          />
        </button>
      </Link>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link href={`/property/${property.id}`}>
            <h3 className="font-semibold text-foreground line-clamp-1 hover:text-[oklch(0.45_0.18_260)] transition-colors">
              {property.title}
            </h3>
          </Link>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span className="line-clamp-1">{property.location}</span>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Bed className="w-3.5 h-3.5" />
            <span>{property.bedrooms}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-3.5 h-3.5" />
            <span>{property.bathrooms}</span>
          </div>
          {(property.landSize || property.floorArea) && (
            <div className="flex items-center gap-1">
              <Maximize className="w-3.5 h-3.5" />
              <span>{property.landSize ? `${property.landSize} sqm` : `${property.floorArea} sqm`}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" />
            <span className="capitalize">{property.propertyType}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <span className="text-lg font-bold text-[oklch(0.45_0.18_260)]">
            {formatPrice(property.price)}
            {property.listingType === "rent" && (
              <span className="text-sm font-normal text-muted-foreground">/month</span>
            )}
          </span>
          <Link
            href={`/property/${property.id}`}
            className="text-sm font-medium text-[oklch(0.45_0.18_260)] hover:underline"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
