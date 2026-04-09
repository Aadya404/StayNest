import { Link } from "react-router-dom";
import { Star, Shield, TrendingUp, Users, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import { listings, categories } from "@/data/mockData";
import heroBg from "@/assets/hero-bg.jpg";

const Index = () => {
  const featured = listings.slice(0, 6);
  const trending = listings.filter((l) => l.surgeMultiplier > 1);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <img src={heroBg} alt="Luxury villa" width={1920} height={1080} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/50 via-foreground/30 to-background" />
        <div className="relative z-10 container mx-auto px-4 text-center space-y-8 pt-16">
          <div className="animate-slide-up space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-primary-foreground leading-tight">
              Find Your Perfect
              <span className="block text-gradient">Stay</span>
            </h1>
            <p className="text-lg sm:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Discover unique homes, cabins, treehouses & more across India. Verified hosts, transparent pricing, instant booking.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-primary-foreground/70 text-sm animate-fade-in">
            {[
              { icon: Shield, label: "Verified Hosts" },
              { icon: Zap, label: "Instant Book" },
              { icon: Star, label: "8,900+ Reviews" },
              { icon: Users, label: "50K+ Guests" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="h-4 w-4" /> {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8">Browse by Category</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/listings?category=${cat.name}`}
              className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-secondary transition-colors group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Listings */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Featured Stays</h2>
            <p className="text-muted-foreground mt-1">Handpicked properties with top ratings</p>
          </div>
          <Link to="/listings">
            <Button variant="outline" className="gap-2">View All <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      {/* Trending */}
      {trending.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-8">
            <TrendingUp className="h-6 w-6 text-warning" />
            <h2 className="text-2xl font-bold">Trending Now</h2>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-warning/10 text-warning">High Demand</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trending.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="bg-secondary py-16 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "1,248+", label: "Active Listings" },
              { value: "8,920+", label: "Happy Guests" },
              { value: "4.7★", label: "Average Rating" },
              { value: "₹24.5L+", label: "Revenue Generated" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-extrabold text-gradient">{value}</p>
                <p className="text-sm text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Become a Host</h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-8">
          Earn up to ₹90,000/month by sharing your space. Start with 10% commission, earn your way down to 5%.
        </p>
        <Link to="/login">
          <Button size="lg" className="rounded-full px-8 gap-2">
            Start Hosting <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
