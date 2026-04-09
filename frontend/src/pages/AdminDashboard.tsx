import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { Shield, Users, Home, DollarSign, AlertTriangle, Flag, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { adminAnalytics } from "@/data/mockData";

const AdminDashboard = () => {
  const [tab, setTab] = useState<"analytics" | "approvals" | "disputes" | "audit">("analytics");

  const pendingListings = [
    { id: 1, title: "Sea-Facing Studio in Vasco", host: "Rohan Fernandes", submitted: "2026-04-01" },
    { id: 2, title: "Luxury Houseboat Kerala", host: "Ananya Menon", submitted: "2026-04-03" },
    { id: 3, title: "Heritage Haveli Jaipur", host: "Sanjay Rathore", submitted: "2026-04-05" },
  ];

  const disputes = [
    { id: 1, guest: "Nikhil R.", host: "Maria D.", issue: "Property not as described", status: "open", date: "2026-03-28" },
    { id: 2, guest: "Aditi S.", host: "Raj T.", issue: "Early checkout refund dispute", status: "investigating", date: "2026-03-30" },
    { id: 3, guest: "James W.", host: "Anil P.", issue: "Damage deposit disagreement", status: "resolved", date: "2026-03-15" },
  ];

  const auditLog = [
    { id: 1, table: "LISTING", operation: "UPDATE", user: "Priya Sharma", time: "2026-04-06 10:15", detail: "Price updated: ₹4000 → ₹4500" },
    { id: 2, table: "RENTAL_REQUEST", operation: "INSERT", user: "System", time: "2026-04-06 09:30", detail: "New booking request #1042" },
    { id: 3, table: "USER_ACCOUNT", operation: "UPDATE", user: "Admin", time: "2026-04-05 18:00", detail: "User banned: suspicious activity" },
    { id: 4, table: "REVIEW", operation: "DELETE", user: "Admin", time: "2026-04-05 16:45", detail: "Flagged review removed (spam)" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 container mx-auto px-4 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Platform management & analytics</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-secondary rounded-xl p-1 w-fit overflow-x-auto">
          {(["analytics", "approvals", "disputes", "audit"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap ${tab === t ? "bg-card shadow-card text-foreground" : "text-muted-foreground"}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === "analytics" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Revenue", value: `₹${(adminAnalytics.totalRevenue / 100000).toFixed(1)}L`, icon: DollarSign },
                { label: "Commission Earned", value: `₹${(adminAnalytics.totalCommission / 1000).toFixed(0)}K`, icon: DollarSign },
                { label: "Active Listings", value: adminAnalytics.activeListings.toString(), icon: Home },
                { label: "Total Users", value: adminAnalytics.totalUsers.toLocaleString(), icon: Users },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-card rounded-xl border border-border p-5 shadow-card">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-card rounded-xl border border-border p-6 shadow-card">
                <h3 className="font-semibold mb-4">Revenue vs Commission (Monthly)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={adminAnalytics.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(v) => `₹${v / 1000}K`} />
                    <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} name="Revenue" />
                    <Line type="monotone" dataKey="commission" stroke="hsl(var(--accent))" strokeWidth={2} name="Commission" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card rounded-xl border border-border p-6 shadow-card">
                <h3 className="font-semibold mb-4">Revenue by City</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={adminAnalytics.revenueByCity} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" fontSize={12} tickFormatter={(v) => `₹${v / 1000}K`} />
                    <YAxis type="category" dataKey="city" fontSize={12} width={60} />
                    <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Pending Approvals", count: adminAnalytics.pendingApprovals, icon: CheckCircle, color: "text-warning" },
                { label: "Open Disputes", count: adminAnalytics.disputesOpen, icon: AlertTriangle, color: "text-destructive" },
                { label: "Fraud Flags", count: adminAnalytics.fraudFlags, icon: Flag, color: "text-destructive" },
              ].map(({ label, count, icon: Icon, color }) => (
                <div key={label} className="bg-card rounded-xl border border-border p-5 shadow-card flex items-center gap-4">
                  <Icon className={`h-8 w-8 ${color}`} />
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "approvals" && (
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Pending Listing Approvals</h3>
            </div>
            <div className="divide-y divide-border">
              {pendingListings.map((l) => (
                <div key={l.id} className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                  <div>
                    <p className="font-medium">{l.title}</p>
                    <p className="text-sm text-muted-foreground">by {l.host} · Submitted {l.submitted}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="gap-1 h-8"><CheckCircle className="h-3.5 w-3.5" /> Approve</Button>
                    <Button size="sm" variant="outline" className="gap-1 h-8"><XCircle className="h-3.5 w-3.5" /> Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "disputes" && (
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Guest", "Host", "Issue", "Status", "Date"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {disputes.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                    <td className="px-4 py-3 text-sm">{d.guest}</td>
                    <td className="px-4 py-3 text-sm">{d.host}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{d.issue}</td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${d.status === "resolved" ? "bg-success/10 text-success" : d.status === "open" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>{d.status}</span></td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{d.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "audit" && (
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Audit Log</h3>
              <p className="text-sm text-muted-foreground">All changes tracked with timestamps</p>
            </div>
            <div className="divide-y divide-border">
              {auditLog.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-secondary/50 transition-colors">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.operation === "INSERT" ? "bg-success/10 text-success" : log.operation === "UPDATE" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>
                    {log.operation}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{log.detail}</p>
                    <p className="text-xs text-muted-foreground">{log.table} · by {log.user} · {log.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
