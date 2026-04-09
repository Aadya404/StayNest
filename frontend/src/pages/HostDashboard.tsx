import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, DollarSign, Calendar, Star, Check, X, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { dashboardStats, bookingRequests } from "@/data/mockData";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, CreditCard, PieChart as PieChartIcon } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

const COLORS = ["hsl(350,80%,56%)", "hsl(170,60%,42%)", "hsl(38,92%,50%)", "hsl(220,70%,50%)", "hsl(280,60%,50%)", "hsl(210,10%,70%)"];

const HostDashboard = () => {
  const [requests, setRequests] = useState(bookingRequests);
  const [tab, setTab] = useState<"overview" | "bookings" | "performance" | "billing">("overview");
  const [billingData, setBillingData] = useState<any>(null);
  const [loadingBilling, setLoadingBilling] = useState(false);

  useEffect(() => {
    if (tab === "billing" && !billingData) {
      fetchBilling();
    }
  }, [tab]);

  const fetchBilling = async () => {
    setLoadingBilling(true);
    try {
      const response = await fetch("http://localhost:5000/api/host/billing");
      const data = await response.json();
      if (data.success) {
        setBillingData(data);
      }
    } catch (error) {
      console.error("Failed to fetch billing data", error);
    } finally {
      setLoadingBilling(false);
    }
  };

  const downloadReceipt = (tx: any) => {
    const doc = new jsPDF() as any;
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(255, 56, 92);
    doc.text("StayNest", 105, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text("Payout Receipt", 105, 30, { align: "center" });
    
    // Info
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Host: ${billingData?.host_name || "StayNest Host"}`, 20, 50);
    doc.text(`Guest: ${tx.guest_name}`, 20, 55);
    doc.text(`Property: ${tx.property_title}`, 20, 60);
    doc.text(`Booking Ref: ${tx.invoice_number}`, 140, 50);
    doc.text(`Date: ${new Date(tx.paid_at || Date.now()).toLocaleDateString()}`, 140, 55);
    doc.text(`Dates: ${tx.check_in} to ${tx.check_out}`, 20, 70);
    
    // Table
    doc.autoTable({
      startY: 80,
      head: [["Category", "Details", "Amount"]],
      body: [
        ["Booking Amount", `${tx.total_nights} nights stay`, `Rs. ${tx.amount.toLocaleString()}`],
        ["Commission", `Platform Fee (${tx.commission_rate})`, `- Rs. ${tx.commission_deducted.toLocaleString()}`],
        ["Net Payout", "Amount settled to bank", `Rs. ${tx.net_payout.toLocaleString()}`],
      ],
      theme: "grid",
      headStyles: { fillStyle: "hsl(350,80%,56%)" },
      columnStyles: { 2: { halign: 'right', fontStyle: 'bold' } }
    });
    
    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(11);
    doc.text("Thank you for hosting with StayNest!", 105, finalY, { align: "center" });
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("This is a system-generated receipt. No signature required.", 105, finalY + 10, { align: "center" });
    
    doc.save(`Payout_${tx.invoice_number}.pdf`);
  };

  const handlePayoutRequest = () => {
    toast.success("Payout request submitted. You'll receive funds within 3–5 business days.", {
      duration: 5000,
    });
  };

  const handleAction = (id: number, status: "approved" | "rejected") => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Host Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, Priya! Here's your overview.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10">
            <Star className="h-4 w-4 fill-gold text-gold" />
            <span className="text-sm font-semibold text-gold">Gold Tier Host</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-secondary rounded-xl p-1 w-fit">
          {(["overview", "bookings", "performance", "billing"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? "bg-card shadow-card text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Earnings", value: `₹${(dashboardStats.totalEarnings / 1000).toFixed(0)}K`, icon: DollarSign, color: "text-accent" },
                { label: "Occupancy Rate", value: `${dashboardStats.occupancyRate}%`, icon: Calendar, color: "text-primary" },
                { label: "Total Bookings", value: dashboardStats.totalBookings.toString(), icon: TrendingUp, color: "text-warning" },
                { label: "Average Rating", value: dashboardStats.averageRating.toString(), icon: Star, color: "text-gold" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-card rounded-xl border border-border p-5 shadow-card">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-card rounded-xl border border-border p-6 shadow-card">
                <h3 className="font-semibold mb-4">Monthly Earnings</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dashboardStats.monthlyEarnings}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(v) => `₹${v / 1000}K`} />
                    <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card rounded-xl border border-border p-6 shadow-card">
                <h3 className="font-semibold mb-4">Bookings by Category</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={dashboardStats.bookingsByCategory} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={11}>
                      {dashboardStats.bookingsByCategory.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {tab === "bookings" && (
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Guest", "Listing", "Dates", "Amount", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium">{r.guestName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{r.listingTitle}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{r.startDate} → {r.endDate}</td>
                      <td className="px-4 py-3 text-sm font-medium">₹{r.totalAmount.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          r.status === "approved" ? "bg-success/10 text-success" :
                          r.status === "rejected" ? "bg-destructive/10 text-destructive" :
                          r.status === "pending" ? "bg-warning/10 text-warning" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {r.status === "approved" && <Check className="h-3 w-3" />}
                          {r.status === "rejected" && <X className="h-3 w-3" />}
                          {r.status === "pending" && <Clock className="h-3 w-3" />}
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="default" onClick={() => handleAction(r.id, "approved")} className="h-7 text-xs">Approve</Button>
                            <Button size="sm" variant="outline" onClick={() => handleAction(r.id, "rejected")} className="h-7 text-xs">Reject</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "performance" && (
          <div className="space-y-6">
            {/* ... performance content ... */}
          </div>
        )}

        {tab === "billing" && (
          <div className="space-y-8 animate-fade-in">
            {loadingBilling ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading your financial overview...</p>
              </div>
            ) : billingData ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total Earnings", value: `₹${billingData.summary.total_earnings.toLocaleString()}`, icon: DollarSign, color: "text-accent" },
                    { label: "Pending Payout", value: `₹${billingData.summary.pending_payouts.toLocaleString()}`, icon: Clock, color: "text-warning" },
                    { label: "Already Paid", value: `₹${billingData.summary.paid_out.toLocaleString()}`, icon: Check, color: "text-success" },
                    { label: "Commission Rate", value: `${billingData.tier.rate}`, icon: Star, color: "text-gold" },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-card rounded-xl border border-border p-5 shadow-card">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <Icon className={`h-5 w-5 ${color}`} />
                      </div>
                      <p className="text-2xl font-bold">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 bg-card rounded-2xl border border-border p-6 shadow-elevated">
                    <h3 className="font-bold flex items-center gap-2 mb-6">
                      <Star className="h-5 w-5 text-gold fill-gold" /> Commission Tier
                    </h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Current Status</p>
                          <p className="text-xl font-bold text-gold">{billingData.tier.name} Host</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Current Rate</p>
                          <p className="text-xl font-bold">{billingData.tier.rate}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>Next Tier: {billingData.tier.next_tier || "Maxed Out"}</span>
                          <span>{billingData.tier.bookings} / {billingData.tier.next_tier === 'Silver' ? 10 : 50} Bookings</span>
                        </div>
                        <Progress value={billingData.tier.progress} className="h-3" />
                        <p className="text-xs text-muted-foreground italic">
                          {billingData.tier.next_tier 
                            ? `Only ${ (billingData.tier.next_tier === 'Silver' ? 10 : 50) - billingData.tier.bookings } more bookings to reach ${billingData.tier.next_tier}!`
                            : "You've reached our top commission tier! Enjoy the 5% flat rate."}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-secondary space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <CreditCard className="h-4 w-4" /> Payout Method
                        </div>
                        <div className="flex justify-between items-center bg-card p-2 rounded-lg border border-border">
                          <span className="text-sm">HDFC Bank **** 4291</span>
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20">Primary</span>
                        </div>
                        <Button variant="ghost" size="sm" className="w-full text-xs h-7">Edit Payouts</Button>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 bg-card rounded-2xl border border-border overflow-hidden shadow-elevated">
                    <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/30">
                      <h3 className="font-bold">Transaction History</h3>
                      <Button variant="outline" size="sm" className="h-8 gap-2">
                        <Download className="h-3.5 w-3.5" /> Export CSV
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="font-bold">Date</TableHead>
                            <TableHead className="font-bold">Guest</TableHead>
                            <TableHead className="font-bold">Property</TableHead>
                            <TableHead className="font-bold">Nights</TableHead>
                            <TableHead className="font-bold text-right">Amount</TableHead>
                            <TableHead className="font-bold text-right text-destructive">Comm.</TableHead>
                            <TableHead className="font-bold text-right text-success">Net Payout</TableHead>
                            <TableHead className="font-bold">Status</TableHead>
                            <TableHead className="font-bold text-center">Receipt</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {billingData.transactions.map((tx: any) => (
                            <TableRow key={tx.payment_id} className="hover:bg-secondary/40 transition-colors">
                              <TableCell className="text-sm whitespace-nowrap">{new Date(tx.paid_at || Date.now()).toLocaleDateString()}</TableCell>
                              <TableCell className="text-sm font-medium">{tx.guest_name}</TableCell>
                              <TableCell className="text-sm max-w-[150px] truncate">{tx.property_title}</TableCell>
                              <TableCell className="text-sm text-center">{tx.total_nights}</TableCell>
                              <TableCell className="text-sm font-medium text-right">₹{tx.amount.toLocaleString()}</TableCell>
                              <TableCell className="text-sm text-right text-destructive">₹{tx.commission_deducted.toLocaleString()}</TableCell>
                              <TableCell className="text-sm font-bold text-right text-success">₹{tx.net_payout.toLocaleString()}</TableCell>
                              <TableCell>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  tx.payment_status === 'completed' ? 'bg-success/10 text-success border border-success/20' : 'bg-warning/10 text-warning border border-warning/20'
                                }`}>
                                  {tx.payment_status}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                  onClick={() => downloadReceipt(tx)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-8">
                  <Button 
                    size="lg" 
                    className="rounded-xl px-12 font-bold shadow-lg gap-2"
                    onClick={handlePayoutRequest}
                  >
                    <DollarSign className="h-5 w-5" /> Request Payout
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Unable to load billing data. Please try again later.</p>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default HostDashboard;
