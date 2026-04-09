import { Link, useNavigate } from "react-router-dom";
import { Heart, Star, Zap, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import type { Listing } from "@/data/mockData";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

import { getListingImage } from "@/lib/images";

const ListingCard = ({ listing }: { listing: Listing }) => {
  const { isAuthenticated, wishlistIds, toggleWishlist } = useAuth();
  const navigate = useNavigate();
  const liked = wishlistIds.includes(listing.id);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate("/login", { state: { message: "Please log in to save listings" } });
      return;
    }

    await toggleWishlist(listing.id);
  };

  return (
    <Link to={`/listing/${listing.id}`} className="group block animate-fade-in">
      <div className="relative overflow-hidden rounded-xl aspect-[4/3]">
        <img
          src={getListingImage(listing.category, listing.id)}
          alt={listing.title}
          loading="lazy"
          width={800}
          height={600}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <button
          onClick={handleToggleLike}
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-card/80 backdrop-blur flex items-center justify-center transition-transform hover:scale-110 shadow-md z-10"
        >
          <Heart className={`h-4 w-4 transition-colors ${liked ? "fill-primary text-primary" : "text-foreground hover:text-primary"}`} />
        </button>

        {listing.isSuperhost && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-card/90 backdrop-blur text-xs font-semibold flex items-center gap-1">
            <Star className="h-3 w-3 fill-gold text-gold" /> Superhost
          </span>
        )}

        {listing.surgeMultiplier > 1 && (
          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-warning text-warning-foreground text-xs font-semibold flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> High Demand
          </span>
        )}

        {listing.instantBook && (
          <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold flex items-center gap-1">
            <Zap className="h-3 w-3" /> Instant
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground truncate pr-2">{listing.title}</h3>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="h-3.5 w-3.5 fill-foreground text-foreground" />
            <span className="text-sm font-medium">{listing.rating}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{listing.city}, {listing.state}</p>
        <p className="text-sm text-muted-foreground">{listing.guests} guests · {listing.bedrooms} bed · {listing.bathrooms} bath</p>
        
        <p className="font-semibold pb-2">
          ₹{listing.pricePerDay.toLocaleString("en-IN")}
          {listing.surgeMultiplier > 1 && <span className="text-xs font-normal text-warning ml-1">(+{Math.round((listing.surgeMultiplier - 1) * 100)}% surge)</span>}
          <span className="text-sm font-normal text-muted-foreground"> / night</span>
        </p>

        <div className="pt-3 border-t border-border flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold ring-2 ring-background">
                 {listing.hostAvatar}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-medium leading-none mb-1">Hosted by</span>
                <span className="text-xs font-bold text-foreground leading-none">{listing.hostName}</span>
              </div>
           </div>
           {listing.isSuperhost && (
             <div className="flex items-center gap-0.5 px-2 py-1 rounded bg-gold/10 text-gold text-[10px] font-black uppercase tracking-tighter border border-gold/20">
                <Star className="h-2.5 w-2.5 fill-gold" /> Superhost
             </div>
           )}
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;
