import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Menu, X, User, Heart, Bell, LayoutDashboard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isHome ? "bg-background/80 backdrop-blur-lg" : "bg-card shadow-card"}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gradient">StayNest</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {[
              { to: "/", label: "Home" },
              { to: "/listings", label: "Explore" },
              { to: "/dashboard", label: "Host Dashboard" },
              { to: "/admin", label: "Admin" },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === to
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative" onClick={() => setShowNotifications(!showNotifications)}>
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">3</span>
            </Button>
            <Link to="/wishlist">
              <Button variant="ghost" size="icon"><Heart className="h-5 w-5" /></Button>
            </Link>
            
            {isAuthenticated ? (
              <div className="flex items-center gap-2 border-l border-border pl-2 ml-2">
                <div className="flex flex-col items-end mr-2">
                  <span className="text-xs font-bold leading-none">{user?.first_name}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{user?.role}</span>
                </div>
                <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
              </div>
            ) : (
              <Link to="/login">
                <Button variant="default" size="sm" className="gap-2">
                  <User className="h-4 w-4" /> Sign In
                </Button>
              </Link>
            )}
          </div>

          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-card border-t border-border animate-slide-up">
          <div className="px-4 py-3 space-y-1">
            {[
              { to: "/", label: "Home", icon: Search },
              { to: "/listings", label: "Explore", icon: Search },
              { to: "/dashboard", label: "Host Dashboard", icon: LayoutDashboard },
              { to: "/admin", label: "Admin", icon: Shield },
              { to: "/wishlist", label: "Wishlist", icon: Heart },
              { to: "/login", label: "Sign In", icon: User },
            ].map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {showNotifications && (
        <div className="absolute right-4 top-16 w-80 bg-card rounded-xl shadow-elevated border border-border p-4 animate-slide-up">
          <h3 className="font-semibold mb-3">Notifications</h3>
          {["New booking request from Arjun Verma", "Price drop alert: Mountain Retreat now ₹2,800/day", "Your listing has been approved!"].map((n, i) => (
            <div key={i} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <p className="text-sm text-muted-foreground">{n}</p>
            </div>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
