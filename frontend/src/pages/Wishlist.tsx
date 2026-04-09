import { Heart, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import type { Listing } from "@/data/mockData";

const Wishlist = () => {
  const { isAuthenticated, loading: authLoading, toggleWishlist } = useAuth();
  const [saved, setSaved] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error("Please log in to view your wishlist");
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    try {
      const response = await fetch("/api/wishlist");
      const data = await response.json();
      if (data.success) {
        // Map backend properties to frontend Listing interface
        const mappedListings: Listing[] = data.properties.map((p: any) => ({
          id: p.property_id,
          title: p.title,
          description: p.description,
          category: p.category_name || "Stay",
          pricePerDay: p.price_per_night,
          depositAmount: p.price_per_night * 1.5,
          location: p.address,
          city: p.city,
          state: p.state,
          country: p.country,
          image: p.primary_image || "/static/images/default_property.jpg",
          rating: p.average_rating || 0,
          reviewCount: p.total_reviews || 0,
          guests: p.max_guests,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          amenities: [], 
          hostName: p.host_first_name && p.host_last_name ? `${p.host_first_name} ${p.host_last_name}` : "Host",
          hostAvatar: p.host_first_name?.[0] || "H",
          isSuperhost: !!p.is_superhost,
          instantBook: true,
          availability: !!p.is_active,
          viewCount: 0,
          surgeMultiplier: 1.0,
        }));
        setSaved(mappedListings);
      }
    } catch (error) {
      toast.error("Failed to fetch wishlist");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (listingId: number) => {
    // Optimistic UI update
    setSaved((prev) => prev.filter((l) => l.id !== listingId));
    try {
      await toggleWishlist(listingId);
    } catch (error) {
      // Rollback if failed
      fetchWishlist();
      toast.error("Failed to remove from wishlist");
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 container mx-auto px-4 max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-6 w-6 text-primary filled fill-primary" />
          <h1 className="text-2xl font-bold">Your Wishlist</h1>
          <span className="text-sm text-muted-foreground">({saved.length} saved)</span>
        </div>

        {saved.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {saved.map((listing) => (
              <div key={listing.id} className="relative group">
                <ListingCard listing={listing} />
                <button
                  onClick={(e) => { e.preventDefault(); handleRemove(listing.id); }}
                  className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-destructive/90 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-destructive transition-all hover:scale-110 shadow-lg"
                  title="Remove from wishlist"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Heart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-xl font-semibold mb-2">No saved properties</p>
            <p className="text-muted-foreground mb-6">Start exploring and save your favorite stays!</p>
            <Link to="/listings"><Button>Explore Listings</Button></Link>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Wishlist;
