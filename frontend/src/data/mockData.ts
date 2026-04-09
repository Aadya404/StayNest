import listing1 from "@/assets/listing-1.jpg";
import listing2 from "@/assets/listing-2.jpg";
import listing3 from "@/assets/listing-3.jpg";
import listing4 from "@/assets/listing-4.jpg";
import listing5 from "@/assets/listing-5.jpg";
import listing6 from "@/assets/listing-6.jpg";

export interface Listing {
  id: number;
  title: string;
  description: string;
  category: string;
  pricePerDay: number;
  depositAmount: number;
  location: string;
  city: string;
  state: string;
  country: string;
  image: string;
  rating: number;
  reviewCount: number;
  guests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  hostName: string;
  hostAvatar: string;
  hostBio?: string;
  hostMemberSince?: string;
  hostResponseRate?: number;
  hostResponseTime?: string;
  isSuperhost: boolean;
  instantBook: boolean;
  availability: boolean;
  viewCount: number;
  surgeMultiplier: number;
}

export interface Review {
  id: number;
  listingId: number;
  reviewerName: string;
  rating: number;
  comment: string;
  date: string;
  type: "renter_to_owner" | "owner_to_renter";
}

export interface BookingRequest {
  id: number;
  listingId: number;
  listingTitle: string;
  guestName: string;
  startDate: string;
  endDate: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  totalAmount: number;
}

export interface DashboardStats {
  totalEarnings: number;
  occupancyRate: number;
  totalBookings: number;
  averageRating: number;
  monthlyEarnings: { month: string; amount: number }[];
  bookingsByCategory: { name: string; value: number }[];
}

export const categories = [
  { id: 1, name: "Apartment", icon: "🏢" },
  { id: 2, name: "Villa", icon: "🏡" },
  { id: 3, name: "Cabin", icon: "🏔️" },
  { id: 4, name: "Beach House", icon: "🏖️" },
  { id: 5, name: "Penthouse", icon: "🌆" },
  { id: 6, name: "Farmhouse", icon: "🌾" },
  { id: 7, name: "Treehouse", icon: "🌳" },
  { id: 8, name: "Houseboat", icon: "🚢" },
];

export const listings: Listing[] = [
  {
    id: 1, title: "Skyline Loft with Panoramic Views", description: "Stunning modern apartment with floor-to-ceiling windows offering breathtaking city skyline views. Perfect for couples and business travelers seeking luxury and comfort.",
    category: "Apartment", pricePerDay: 4500, depositAmount: 5000, location: "Bandra West", city: "Mumbai", state: "Maharashtra", country: "India",
    image: listing1, rating: 4.8, reviewCount: 124, guests: 4, bedrooms: 2, bathrooms: 2,
    amenities: ["WiFi", "AC", "Kitchen", "Parking", "Gym", "Pool"], hostName: "Priya Sharma", hostAvatar: "PS", 
    hostBio: "Architect and travel enthusiast. I love design and hospitality. My spaces are curated to offer the best of Mumbai's skyline with modern comfort.",
    hostMemberSince: "Oct 2021", hostResponseRate: 100, hostResponseTime: "Within an hour",
    isSuperhost: true, instantBook: true, availability: true, viewCount: 3420, surgeMultiplier: 1.0,
  },
  {
    id: 2, title: "Rustic Mountain Retreat", description: "Escape to this cozy log cabin nestled in autumn forests with stunning mountain backdrop. Fireplace, hot tub, and complete serenity await you.",
    category: "Cabin", pricePerDay: 3200, depositAmount: 3000, location: "Old Manali", city: "Manali", state: "Himachal Pradesh", country: "India",
    image: listing2, rating: 4.9, reviewCount: 89, guests: 6, bedrooms: 3, bathrooms: 2,
    amenities: ["Fireplace", "Hot Tub", "Kitchen", "Mountain View", "Hiking Trail"], hostName: "Raj Thakur", hostAvatar: "RT", isSuperhost: true, instantBook: false, availability: true, viewCount: 2890, surgeMultiplier: 1.2,
  },
  {
    id: 3, title: "Tropical Paradise Bungalow", description: "Wake up to turquoise waters and white sand. This beachfront bungalow is perfect for a romantic getaway or family vacation.",
    category: "Beach House", pricePerDay: 6800, depositAmount: 8000, location: "Palolem Beach", city: "Goa", state: "Goa", country: "India",
    image: listing3, rating: 4.7, reviewCount: 201, guests: 4, bedrooms: 2, bathrooms: 1,
    amenities: ["Beach Access", "WiFi", "Kitchen", "Outdoor Shower", "Hammock"], hostName: "Maria D'Souza", hostAvatar: "MD", isSuperhost: false, instantBook: true, availability: true, viewCount: 5210, surgeMultiplier: 1.5,
  },
  {
    id: 4, title: "Luxury Penthouse Suite", description: "Experience the height of luxury in this penthouse with curved glass walls and panoramic city views. Premium furnishing and 5-star amenities.",
    category: "Penthouse", pricePerDay: 12000, depositAmount: 15000, location: "Connaught Place", city: "New Delhi", state: "Delhi", country: "India",
    image: listing4, rating: 4.9, reviewCount: 67, guests: 2, bedrooms: 1, bathrooms: 1,
    amenities: ["WiFi", "AC", "Concierge", "Spa", "Rooftop Bar", "Valet Parking"], hostName: "Vikram Malhotra", hostAvatar: "VM", isSuperhost: true, instantBook: true, availability: true, viewCount: 1890, surgeMultiplier: 1.0,
  },
  {
    id: 5, title: "Heritage Countryside Farmhouse", description: "Step back in time at this charming stone farmhouse with rolling hills and flower gardens. Perfect for families and group retreats.",
    category: "Farmhouse", pricePerDay: 5500, depositAmount: 6000, location: "Lonavala", city: "Pune", state: "Maharashtra", country: "India",
    image: listing5, rating: 4.6, reviewCount: 156, guests: 10, bedrooms: 4, bathrooms: 3,
    amenities: ["Garden", "BBQ", "Kitchen", "Bonfire Pit", "Farm Animals", "Parking"], hostName: "Anil Patil", hostAvatar: "AP", isSuperhost: false, instantBook: false, availability: true, viewCount: 4100, surgeMultiplier: 1.0,
  },
  {
    id: 6, title: "Enchanted Forest Treehouse", description: "A magical treehouse experience surrounded by lush greenery. Disconnect from the world and reconnect with nature in this unique stay.",
    category: "Treehouse", pricePerDay: 3800, depositAmount: 4000, location: "Wayanad", city: "Wayanad", state: "Kerala", country: "India",
    image: listing6, rating: 4.8, reviewCount: 93, guests: 2, bedrooms: 1, bathrooms: 1,
    amenities: ["Nature Trail", "Bird Watching", "WiFi", "Breakfast Included"], hostName: "Lakshmi Nair", hostAvatar: "LN", isSuperhost: true, instantBook: true, availability: true, viewCount: 3760, surgeMultiplier: 1.3,
  },
];

export const reviews: Review[] = [
  { id: 1, listingId: 1, reviewerName: "Amit K.", rating: 5, comment: "Absolutely stunning views! The apartment was spotless and Priya was an amazing host. Will definitely come back!", date: "2026-03-15", type: "renter_to_owner" },
  { id: 2, listingId: 1, reviewerName: "Sarah L.", rating: 4, comment: "Great location and beautiful interiors. The kitchen was well-equipped. Minor issue with hot water but resolved quickly.", date: "2026-03-01", type: "renter_to_owner" },
  { id: 3, listingId: 2, reviewerName: "Deepak R.", rating: 5, comment: "The cabin exceeded all expectations. Waking up to mountain views with a cup of chai was magical!", date: "2026-02-20", type: "renter_to_owner" },
  { id: 4, listingId: 3, reviewerName: "Nina P.", rating: 5, comment: "Paradise on earth! The beach was right at our doorstep. Perfect romantic getaway.", date: "2026-03-10", type: "renter_to_owner" },
  { id: 5, listingId: 4, reviewerName: "Rohit M.", rating: 5, comment: "The penthouse was unreal. Felt like a king with those views. Concierge service was top-notch.", date: "2026-02-28", type: "renter_to_owner" },
];

export const bookingRequests: BookingRequest[] = [
  { id: 1, listingId: 1, listingTitle: "Skyline Loft", guestName: "Arjun Verma", startDate: "2026-04-10", endDate: "2026-04-15", status: "pending", totalAmount: 22500 },
  { id: 2, listingId: 2, listingTitle: "Mountain Retreat", guestName: "Sneha Gupta", startDate: "2026-04-20", endDate: "2026-04-25", status: "approved", totalAmount: 16000 },
  { id: 3, listingId: 3, listingTitle: "Paradise Bungalow", guestName: "John Smith", startDate: "2026-05-01", endDate: "2026-05-07", status: "pending", totalAmount: 40800 },
  { id: 4, listingId: 1, listingTitle: "Skyline Loft", guestName: "Meera Iyer", startDate: "2026-04-18", endDate: "2026-04-20", status: "rejected", totalAmount: 9000 },
  { id: 5, listingId: 5, listingTitle: "Heritage Farmhouse", guestName: "Kabir Singh", startDate: "2026-05-10", endDate: "2026-05-15", status: "approved", totalAmount: 27500 },
];

export const dashboardStats: DashboardStats = {
  totalEarnings: 485000,
  occupancyRate: 78,
  totalBookings: 342,
  averageRating: 4.7,
  monthlyEarnings: [
    { month: "Oct", amount: 62000 }, { month: "Nov", amount: 78000 }, { month: "Dec", amount: 95000 },
    { month: "Jan", amount: 72000 }, { month: "Feb", amount: 88000 }, { month: "Mar", amount: 90000 },
  ],
  bookingsByCategory: [
    { name: "Apartment", value: 35 }, { name: "Villa", value: 25 }, { name: "Cabin", value: 15 },
    { name: "Beach House", value: 12 }, { name: "Penthouse", value: 8 }, { name: "Other", value: 5 },
  ],
};

export const adminAnalytics = {
  totalRevenue: 2450000,
  totalCommission: 245000,
  activeListings: 1248,
  totalUsers: 8920,
  revenueByCity: [
    { city: "Mumbai", revenue: 680000 }, { city: "Goa", revenue: 520000 }, { city: "Delhi", revenue: 440000 },
    { city: "Manali", revenue: 310000 }, { city: "Pune", revenue: 280000 }, { city: "Kerala", revenue: 220000 },
  ],
  monthlyRevenue: [
    { month: "Oct", revenue: 320000, commission: 32000 },
    { month: "Nov", revenue: 380000, commission: 38000 },
    { month: "Dec", revenue: 520000, commission: 52000 },
    { month: "Jan", revenue: 410000, commission: 41000 },
    { month: "Feb", revenue: 390000, commission: 39000 },
    { month: "Mar", revenue: 430000, commission: 43000 },
  ],
  pendingApprovals: 23,
  disputesOpen: 7,
  fraudFlags: 3,
};
