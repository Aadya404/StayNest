import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

interface User {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'guest' | 'host' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  wishlistIds: number[];
  toggleWishlist: (listingId: number) => Promise<void>;
  refreshWishlist: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlistIds = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/wishlist/ids');
      const data = await response.json();
      if (data.success) {
        setWishlistIds(data.ids || []);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist IDs', error);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('staynest_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchWishlistIds();
    } else {
      setWishlistIds([]);
    }
  }, [user]);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('staynest_user', JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    setWishlistIds([]);
    localStorage.removeItem('staynest_user');
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success("Logged out successfully");
  };

  const toggleWishlist = async (listingId: number) => {
    if (!user) {
      toast.error("Please log in to save listings");
      return;
    }

    try {
      const response = await fetch(`/api/wishlist/toggle/${listingId}`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        toast.error("Session expired. Please log in again.");
        logout();
        return;
      }

      const data = await response.json();
      if (data.success) {
        setWishlistIds(prev => 
          data.added 
            ? [...prev, listingId] 
            : prev.filter(id => id !== listingId)
        );
        toast.success(data.message || (data.added ? "Added to wishlist" : "Removed from wishlist"));
      } else {
        toast.error(data.error || "Failed to update wishlist");
      }
    } catch (error) {
      toast.error("Failed to update wishlist");
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      isAuthenticated: !!user,
      wishlistIds,
      toggleWishlist,
      refreshWishlist: fetchWishlistIds
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
