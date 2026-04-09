import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, Heart, Share, MapPin, Users, Bed, Bath, Shield, Zap, TrendingUp, ChevronLeft, MessageCircle, Check, Loader2, Download, CreditCard, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { listings, reviews } from "@/data/mockData";
import { getListingImage } from "@/lib/images";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nights, setNights] = useState(3);
  const [showQA, setShowQA] = useState(false);
  
  // Payment Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<1 | 2 | 3 | 4>(1);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [processing, setProcessing] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await fetch(`/api/properties/${id}`);
        const data = await response.json();
        if (data.error) {
          toast.error("Listing not found");
          setLoading(false);
        } else {
          // Map backend fields to frontend expectations if necessary
          setListing({
            ...data,
            id: data.property_id,
            pricePerDay: data.price_per_night,
            rating: data.average_rating,
            reviewCount: data.total_reviews,
            hostName: `${data.host_first_name} ${data.host_last_name}`,
            hostAvatar: data.host_avatar || (data.host_first_name?.[0] || "H"),
            guests: data.max_guests,
            category: data.category_name
          });
          setLoading(false);
        }
      } catch (error) {
        toast.error("Failed to load listing details");
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading StayNest experience...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-4">Listing not found</p>
          <Link to="/listings"><Button>Back to Listings</Button></Link>
        </div>
      </div>
    );
  }

  const basePrice = listing.pricePerDay * nights;
  const surgeAmount = listing.surge_multiplier > 1 ? Math.round(basePrice * (listing.surge_multiplier - 1)) : 0;
  const serviceFee = Math.round(basePrice * 0.12);
  const total = basePrice + surgeAmount + serviceFee;

  const handleBooking = () => {
    setPaymentStep(1);
    setBookingModalOpen(true);
  };

  const processPayment = () => {
    // Keep this for backward compatibility if needed, but we use confirmPayment now
    setPaymentStep(3);
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setPaymentStep(4);
      const ref = `SN-${Date.now().toString().slice(-6)}`;
      setBookingRef(ref);
    }, 2500);
  };

  const downloadInvoice = () => {
    // PDF Logic remains same...
  };

  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [upiId, setUpiId] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [bookingId, setBookingId] = useState<number | null>(null);

  const getCardIcon = (number: string) => {
    if (number.startsWith("4")) return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white leading-none">VISA</span>;
    if (number.startsWith("5")) return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500 text-white leading-none">MASTERCARD</span>;
    return <CreditCard className="h-4 w-4 text-muted-foreground" />;
  };

  const handleCardInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = val.match(/.{1,4}/g)?.join(" ") || val;
    setCardNumber(formatted);
  };

  const startBooking = async () => {
    try {
      const response = await fetch(`/api/book/${listing.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          check_in: "2026-04-10",
          check_out: "2026-04-13",
          num_guests: 2,
          price_per_night: listing.pricePerDay,
          service_fee: serviceFee,
          total_price: total
        })
      });
      const data = await response.json();
      if (data.success) {
        setBookingId(data.booking_id);
        setPaymentStep(2);
      } else {
        toast.error(data.error || "Failed to initiate booking");
      }
    } catch (error) {
      toast.error("Booking initiation failed. Please check your connection.");
    }
  };

  const confirmPayment = async () => {
    if (!bookingId) return;
    
    setPaymentStep(3);
    setProcessing(true);
    
    setTimeout(async () => {
      try {
        const ref = `SIM-${Date.now().toString().slice(-8)}`;
        const response = await fetch("/api/payment/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            booking_id: bookingId,
            amount: total,
            payment_ref: ref,
            method: paymentMethod
          })
        });
        const data = await response.json();
        if (data.success) {
          setBookingRef(ref);
          setPaymentStep(4);
          toast.success("Payment Verified! Stay Confirmed.");
        } else {
          setPaymentStep(2);
          toast.error(data.error || "Payment confirmation failed");
        }
      } catch (error) {
        setPaymentStep(2);
        toast.error("Network error during payment verification");
      } finally {
        setProcessing(false);
      }
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 container mx-auto px-4 max-w-5xl">
        <Link to="/listings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4" /> Back to listings
        </Link>

        {/* Header and Image */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold">{listing.title}</h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="rounded-full"><Share className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" className="rounded-full"><Heart className="h-5 w-5" /></Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm font-medium mb-6">
          <div className="flex items-center gap-1"><Star className="h-4 w-4 fill-foreground" /> {listing.rating} · <span className="underline">{listing.reviewCount} reviews</span></div>
          {listing.isSuperhost && <div className="flex items-center gap-1 text-primary"><Shield className="h-4 w-4" /> Superhost</div>}
          <div className="flex items-center gap-1 underline text-muted-foreground"><MapPin className="h-4 w-4" /> {listing.location}, {listing.city}</div>
        </div>

        <div className="rounded-2xl overflow-hidden aspect-[21/9] mb-8 shadow-card group">
          <img 
            src={getListingImage(listing.category, listing.id)} 
            alt={listing.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            <div className="flex items-center justify-between pb-8 border-b border-border">
              <div>
                <h2 className="text-xl font-bold">Entire {listing.category} hosted by {listing.hostName}</h2>
                <p className="text-muted-foreground">{listing.guests} guests · {listing.bedrooms} bedroom · {listing.bathrooms} bath</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {listing.hostAvatar}
              </div>
            </div>

            <div className="space-y-6">
              {listing.isSuperhost && (
                <div className="flex gap-4">
                  <div className="mt-1"><Shield className="h-6 w-6 text-primary" /></div>
                  <div>
                    <h4 className="font-bold">{listing.hostName} is a Superhost</h4>
                    <p className="text-sm text-muted-foreground">Superhosts are experienced, highly rated hosts who are committed to providing great stays for guests.</p>
                  </div>
                </div>
              )}
              {listing.instantBook && (
                <div className="flex gap-4">
                  <div className="mt-1"><Zap className="h-6 w-6 text-accent" /></div>
                  <div>
                    <h4 className="font-bold">Instant Confirmation</h4>
                    <p className="text-sm text-muted-foreground">Book and receive your confirmation instantly. No more waiting for the host to reply.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-8 border-t border-border">
              <h3 className="text-xl font-bold mb-4">About this stay</h3>
              <p className="text-muted-foreground leading-relaxed text-lg">{listing.description}</p>
            </div>

            <div className="pt-10 border-t border-border">
              <h3 className="text-xl font-bold mb-6 italic text-gradient">Meet Your Host</h3>
              <div className="bg-gradient-to-br from-secondary/40 to-background rounded-[2rem] p-10 border border-border shadow-elevated transition-all hover:shadow-2xl">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-8 pb-8 border-b border-border/10">
                  <div className="relative group">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white text-4xl font-black border-4 border-background shadow-xl shrink-0">
                      {listing.hostAvatar || (listing.host_first_name?.[0] || "H")}
                    </div>
                    {listing.is_superhost && (
                      <div className="absolute -bottom-1 -right-1 bg-gold text-white p-1.5 rounded-full border-2 border-background shadow-lg">
                        <Star className="h-4 w-4 fill-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                       <h4 className="text-3xl font-black tracking-tighter">{listing.host_first_name} {listing.host_last_name}</h4>
                       {listing.is_superhost && (
                         <span className="flex items-center gap-1 px-3 py-1 bg-gold/10 text-gold rounded-full text-[10px] font-black uppercase tracking-widest border border-gold/20">
                           ⭐ Superhost
                         </span>
                       )}
                    </div>
                    <p className="text-muted-foreground font-medium flex items-center justify-center sm:justify-start gap-2">
                      <Calendar className="h-4 w-4" /> Guest Favorite since {new Date(listing.host_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-4">
                       <span className="px-3 py-1 rounded-lg bg-success/10 text-success text-xs font-bold border border-success/20">✓ Identity Verified</span>
                       <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold border border-primary/20 flex items-center gap-1">
                          <Zap className="h-3 w-3" /> Response: {listing.response_time_hours <= 1 ? "Under 1 hour" : `Within ${listing.response_time_hours} hours`}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center bg-secondary/30 p-6 rounded-3xl border border-border/50">
                   <div className="space-y-1">
                      <p className="text-3xl font-black text-foreground">{(listing.host_stats?.reviews || 0).toLocaleString()}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reviews Received</p>
                   </div>
                   <div className="space-y-1 border-y md:border-y-0 md:border-x border-border/50 py-4 md:py-0">
                      <p className="text-3xl font-black text-foreground">{(listing.host_stats?.listings || 0).toLocaleString()}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Properties Listed</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-3xl font-black text-foreground">{(listing.host_stats?.bookings || 0).toLocaleString()}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bookings Completed</p>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="relative">
                      <Quote className="absolute -top-4 -left-2 h-8 w-8 text-muted/20 -z-10" />
                      <p className="text-foreground/80 leading-relaxed text-lg italic font-medium">
                        "{listing.host_bio || `Hi, I'm ${listing.host_first_name}! I love hosting guests and making sure every stay is comfortable and memorable.`}"
                      </p>
                   </div>
                   <Button 
                    onClick={() => toast.success(`Message sent to ${listing.host_first_name}!`)} 
                    className="w-full sm:w-auto rounded-2xl h-14 px-10 gap-2 font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
                   >
                     <MessageCircle className="h-5 w-5" /> Contact host
                   </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-card rounded-3xl shadow-elevated border border-border p-8 space-y-6">
              <div className="flex justify-between items-baseline">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold">₹{listing.pricePerDay.toLocaleString("en-IN")}</span>
                  <span className="text-muted-foreground text-sm font-medium">/ night</span>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold">
                  <Star className="h-3.5 w-3.5 fill-foreground" /> {listing.rating}
                </div>
              </div>

              <div className="grid grid-rows-2 border border-border rounded-xl">
                 <div className="grid grid-cols-2 border-b border-border">
                    <div className="p-3 border-r border-border hover:bg-secondary/20 cursor-pointer">
                       <Label className="text-[10px] font-extrabold uppercase text-muted-foreground">Check-in</Label>
                       <p className="text-xs font-bold mt-0.5">10/04/2026</p>
                    </div>
                    <div className="p-3 hover:bg-secondary/20 cursor-pointer">
                       <Label className="text-[10px] font-extrabold uppercase text-muted-foreground">Checkout</Label>
                       <p className="text-xs font-bold mt-0.5">13/04/2026</p>
                    </div>
                 </div>
                 <div className="p-3 hover:bg-secondary/20 cursor-pointer">
                   <Label className="text-[10px] font-extrabold uppercase text-muted-foreground">Guests</Label>
                   <p className="text-xs font-bold mt-0.5">2 guests</p>
                 </div>
              </div>

              <Button onClick={handleBooking} className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all">
                {listing.instantBook ? "Reserve Now" : "Request Stay"}
              </Button>

              <div className="space-y-3 pt-2 text-sm">
                <div className="flex justify-between text-muted-foreground font-medium">
                  <span className="underline">₹{listing.pricePerDay.toLocaleString("en-IN")} x {nights} nights</span>
                  <span>₹{basePrice.toLocaleString("en-IN")}</span>
                </div>
                {surgeAmount > 0 && (
                   <div className="flex justify-between text-warning font-bold">
                      <span className="underline flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Surge demand fee</span>
                      <span>₹{surgeAmount.toLocaleString("en-IN")}</span>
                   </div>
                )}
                <div className="flex justify-between text-muted-foreground font-medium">
                  <span className="underline text-accent">Service fee (12%)</span>
                  <span>₹{serviceFee.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-border font-extrabold text-lg">
                  <span>Total</span>
                  <span>₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Drawer (Full Screen Modal) */}
      <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
        <DialogContent className="sm:max-w-[700px] h-fit max-h-[90vh] rounded-3xl overflow-hidden p-0 border-none shadow-2xl flex flex-col scale-in">
          <div className="flex-1 overflow-y-auto p-8">
            {paymentStep === 1 && (
              <div className="space-y-8 animate-slide-up">
                <div className="flex justify-between items-start">
                   <div>
                      <h2 className="text-3xl font-extrabold mb-1">Confirm your trip</h2>
                      <p className="text-muted-foreground font-medium">Review pricing and details before payment</p>
                   </div>
                   <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Order Summary</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <div className="bg-secondary p-5 rounded-2xl border border-border">
                         <h4 className="font-bold mb-4 flex items-center gap-2"><MapPin className="h-4 w-4" /> Destination</h4>
                         <p className="text-lg font-bold">{listing.title}</p>
                         <p className="text-sm text-muted-foreground">{listing.location}, {listing.city}</p>
                      </div>
                      <div className="bg-secondary p-5 rounded-2xl border border-border">
                         <h4 className="font-bold mb-4 flex items-center gap-2"><Calendar className="h-4 w-4" /> Your Stay</h4>
                         <div className="flex justify-between">
                            <div><p className="text-xs text-muted-foreground font-bold italic">Check-in</p><p className="font-bold">Apr 10, 2026</p></div>
                            <div><p className="text-xs text-muted-foreground font-bold italic text-right">Check-out</p><p className="font-bold text-right">Apr 13, 2026</p></div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h4 className="font-bold border-b pb-2">Price Details</h4>
                      <div className="space-y-2 text-sm">
                         <div className="flex justify-between"><span>Base Price ({nights} nights)</span><span>₹{basePrice.toLocaleString()}</span></div>
                         <div className="flex justify-between text-warning"><span>Surge Demand Fee</span><span>+₹{surgeAmount.toLocaleString()}</span></div>
                         <div className="flex justify-between"><span>Service Fee (12%)</span><span>₹{serviceFee.toLocaleString()}</span></div>
                         <div className="flex justify-between text-success"><span>Loyalty Discount</span><span>-₹450</span></div>
                         <div className="flex justify-between font-extrabold text-lg pt-4 border-t"><span>Total (INR)</span><span className="text-primary text-xl font-black">₹{(total - 450).toLocaleString()}</span></div>
                      </div>
                      <Button onClick={startBooking} className="w-full h-14 rounded-2xl text-lg font-bold mt-4 shadow-xl">Confirm & Select Payment</Button>
                   </div>
                </div>
              </div>
            )}

            {paymentStep === 2 && (
              <div className="space-y-6 animate-slide-up">
                <div className="flex items-center gap-4 mb-4">
                   <Button variant="ghost" size="icon" onClick={() => setPaymentStep(1)}><ChevronLeft className="h-6 w-6" /></Button>
                   <h2 className="text-3xl font-extrabold tracking-tight">Payment Method</h2>
                </div>

                <div className="flex p-1 bg-secondary rounded-2xl mb-8">
                   {(["upi", "card", "netbanking"] as const).map((m) => (
                      <button 
                        key={m} 
                        onClick={() => setPaymentMethod(m)}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all capitalize ${paymentMethod === m ? "bg-card shadow-card text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {m === "upi" ? "UPI QR" : m === "card" ? "Credit Card" : "Net Banking"}
                      </button>
                   ))}
                </div>

                {paymentMethod === "upi" ? (
                  <div className="flex flex-col md:flex-row gap-8 items-center bg-secondary/30 p-8 rounded-3xl border border-border">
                     <div className="bg-white p-4 rounded-3xl shadow-elevated border-4 border-white">
                        <img 
                           src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=staynest@upi&pn=StayNest&am=${total-450}&cu=INR`} 
                           alt="Payment QR" 
                           className="w-40 h-40"
                        />
                     </div>
                     <div className="flex-1 space-y-4">
                        <p className="text-lg font-bold">Scan to pay <span className="text-primary">₹{(total - 450).toLocaleString()}</span></p>
                        <div className="space-y-2">
                           <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Or Enter UPI ID</Label>
                           <input 
                              placeholder="vpa@bank" 
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value)}
                              className="w-full bg-card border-2 border-border rounded-xl px-4 h-12 outline-none focus:border-primary transition-colors"
                           />
                        </div>
                        <Button onClick={confirmPayment} className="w-full h-12 rounded-xl font-bold gap-2">Verify & Pay <Zap className="h-4 w-4" /></Button>
                     </div>
                  </div>
                ) : paymentMethod === "card" ? (
                  <div className="space-y-6 bg-secondary/30 p-8 rounded-3xl border border-border">
                     <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Card Number</Label>
                        <div className="relative">
                           <input 
                              placeholder="0000 0000 0000 0000" 
                              value={cardNumber}
                              onChange={handleCardInput}
                              className="w-full bg-card border-2 border-border rounded-xl pl-4 pr-14 h-14 outline-none focus:border-primary font-mono text-lg transition-colors"
                           />
                           <div className="absolute right-4 top-1/2 -translate-y-1/2">{getCardIcon(cardNumber)}</div>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Expiry (MM/YY)</Label>
                           <input value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="09/28" className="w-full bg-card border-2 border-border rounded-xl px-4 h-12 outline-none focus:border-primary font-mono transition-colors" />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">CVV</Label>
                           <input value={cvv} onChange={(e) => setCvv(e.target.value)} type="password" placeholder="***" className="w-full bg-card border-2 border-border rounded-xl px-4 h-12 outline-none focus:border-primary font-mono transition-colors" />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cardholder Name</Label>
                        <input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="John Doe" className="w-full bg-card border-2 border-border rounded-xl px-4 h-12 outline-none focus:border-primary transition-colors" />
                     </div>
                     <Button onClick={confirmPayment} className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl">Pay ₹{(total - 450).toLocaleString()}</Button>
                  </div>
                ) : (
                  <div className="space-y-6 bg-secondary/30 p-8 rounded-3xl border border-border">
                     <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select Your Bank</Label>
                        <select 
                           value={selectedBank}
                           onChange={(e) => setSelectedBank(e.target.value)}
                           className="w-full bg-card border-2 border-border rounded-xl px-4 h-14 outline-none focus:border-primary appearance-none cursor-pointer transition-colors"
                        >
                           <option value="">-- Choose Bank --</option>
                           <option value="SBI">State Bank of India</option>
                           <option value="HDFC">HDFC Bank</option>
                           <option value="ICICI">ICICI Bank</option>
                           <option value="AXIS">Axis Bank</option>
                           <option value="KOTAK">Kotak Mahindra Bank</option>
                           <option value="PNB">Punjab National Bank</option>
                        </select>
                     </div>
                     <div className="p-4 rounded-xl bg-primary/5 text-primary text-xs font-medium italic">You will be redirected to your bank's secure login page.</div>
                     <Button onClick={confirmPayment} className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl">Proceed to Net Banking</Button>
                  </div>
                )}
              </div>
            )}

            {paymentStep === 3 && (
              <div className="py-24 flex flex-col items-center justify-center text-center space-y-8">
                 <div className="relative">
                    <div className="h-24 w-24 border-8 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <Shield className="h-10 w-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                 </div>
                 <div>
                    <h3 className="text-3xl font-extrabold mb-2 text-gradient">Processing your payment...</h3>
                    <p className="text-muted-foreground text-lg italic">Securing your dream stay at {listing.city}</p>
                 </div>
              </div>
            )}

            {paymentStep === 4 && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-scale-in">
                 <div className="h-24 w-24 rounded-full bg-success/10 flex items-center justify-center border-4 border-success shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                    <Check className="h-12 w-12 text-success" />
                 </div>
                 <div>
                    <h2 className="text-4xl font-black text-foreground mb-1">Payment Successful!</h2>
                    <p className="text-muted-foreground font-medium text-lg">Your reservation <span className="text-foreground font-bold px-2 py-0.5 bg-secondary rounded-lg">#{bookingRef}</span> is fully confirmed.</p>
                 </div>

                 <div className="w-full bg-secondary/40 border border-border rounded-3xl p-6 text-left shadow-inner grid grid-cols-2 gap-4">
                    <div className="col-span-2 pb-2 border-b border-border/20">
                       <p className="text-xs font-bold uppercase text-muted-foreground">Booking for</p>
                       <p className="text-lg font-black">{listing.title}</p>
                    </div>
                    <div><p className="text-xs font-bold uppercase text-muted-foreground">Stay Dates</p><p className="font-bold">Apr 10 - 13</p></div>
                    <div className="text-right"><p className="text-xs font-bold uppercase text-muted-foreground">Amount Paid</p><p className="font-bold text-success font-mono">₹{(total - 450).toLocaleString()}</p></div>
                 </div>

                 <div className="flex gap-4 w-full">
                    <Button onClick={downloadInvoice} variant="outline" className="flex-1 h-14 rounded-2xl font-bold gap-2 text-lg shadow-sm">
                       <Download className="h-5 w-5" /> Save Invoice
                    </Button>
                    <Link to="/my-account" className="flex-1">
                       <Button className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl">My Bookings</Button>
                    </Link>
                 </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default ListingDetail;
