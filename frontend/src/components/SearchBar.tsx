import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const SearchBar = ({ variant = "hero" }: { variant?: "hero" | "compact" }) => {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");

  const handleSearch = () => {
    navigate(`/listings${location ? `?q=${encodeURIComponent(location)}` : ""}`);
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 bg-card rounded-full shadow-card border border-border px-4 py-2 max-w-xl w-full">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Search destinations..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <Button size="sm" onClick={handleSearch} className="rounded-full h-8 px-4">Search</Button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-elevated border border-border p-2 max-w-3xl w-full mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-secondary transition-colors">
          <MapPin className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground">Where</p>
            <input
              type="text"
              placeholder="Search destinations"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full bg-transparent text-sm outline-none font-medium placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-secondary transition-colors">
          <Calendar className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Check in</p>
            <p className="text-sm font-medium">Add dates</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-secondary transition-colors">
          <Calendar className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Check out</p>
            <p className="text-sm font-medium">Add dates</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-secondary transition-colors flex-1">
            <Users className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Guests</p>
              <p className="text-sm font-medium">Add guests</p>
            </div>
          </div>
          <Button onClick={handleSearch} size="icon" className="h-12 w-12 rounded-full shrink-0">
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
