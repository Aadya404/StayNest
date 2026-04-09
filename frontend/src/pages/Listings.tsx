import { useState, useMemo } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import ListingCard from "@/components/ListingCard";
import { listings, categories } from "@/data/mockData";

const Listings = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 15000]);
  const [sortBy, setSortBy] = useState("recommended");
  const [showFilters, setShowFilters] = useState(false);
  const [guestFilter, setGuestFilter] = useState(0);

  const filtered = useMemo(() => {
    let result = listings.filter(
      (l) =>
        l.pricePerDay >= priceRange[0] &&
        l.pricePerDay <= priceRange[1] &&
        (!selectedCategory || l.category === selectedCategory) &&
        l.guests >= guestFilter
    );
    if (sortBy === "price-low") result.sort((a, b) => a.pricePerDay - b.pricePerDay);
    else if (sortBy === "price-high") result.sort((a, b) => b.pricePerDay - a.pricePerDay);
    else if (sortBy === "rating") result.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "popular") result.sort((a, b) => b.viewCount - a.viewCount);
    return result;
  }, [selectedCategory, priceRange, sortBy, guestFilter]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 container mx-auto px-4">
        <div className="flex justify-center mb-8">
          <SearchBar variant="compact" />
        </div>

        {/* Category chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.name
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-border hover:bg-secondary transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="bg-card rounded-xl border border-border p-6 mb-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Filters</h3>
              <button onClick={() => setShowFilters(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Price Range (₹/night)</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={priceRange[0]} onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Min" />
                  <span className="text-muted-foreground">–</span>
                  <input type="number" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], +e.target.value])} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Max" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Min Guests</label>
                <input type="number" value={guestFilter} onChange={(e) => setGuestFilter(+e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" min={0} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm">
                  <option value="recommended">Recommended</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">{filtered.length} properties found</p>
          {selectedCategory && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)} className="gap-1 text-xs">
              <X className="h-3 w-3" /> Clear: {selectedCategory}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-20">
              <p className="text-xl font-semibold mb-2">No properties found</p>
              <p className="text-muted-foreground">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Listings;
