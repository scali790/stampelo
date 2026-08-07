import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { startLogin } from "@/const";
import { ArrowLeft, RefreshCw, Trash2, ToggleLeft, ToggleRight, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

function StatCard({ title, value, sub }: { title: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm font-medium text-slate-700">{title}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

export default function Admin() {
  const { user, isAuthenticated, loading } = useAuth();
  const [customerSearch, setCustomerSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState<"pending" | "paid" | "fulfilled" | "failed" | undefined>();

  const { data: stats } = trpc.admin.stats.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: orders = [], refetch: refetchOrders } = trpc.admin.listOrders.useQuery({ status: orderFilter }, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: customers = [] } = trpc.admin.listCustomers.useQuery({ search: customerSearch }, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: designs = [] } = trpc.admin.listDesigns.useQuery({}, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: templates = [], refetch: refetchTemplates } = trpc.admin.listTemplates.useQuery({}, { enabled: isAuthenticated && user?.role === "admin" });

  const retryFulfillment = trpc.admin.retryFulfillment.useMutation({
    onSuccess: () => { toast.success("Fulfillment retry queued"); refetchOrders(); },
    onError: () => toast.error("Failed to retry"),
  });

  const toggleTemplate = trpc.admin.toggleTemplate.useMutation({
    onSuccess: () => { toast.success("Template updated"); refetchTemplates(); },
    onError: () => toast.error("Failed to update template"),
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-sm p-6 text-center space-y-3">
          <h2 className="font-bold text-lg">Admin Access Required</h2>
          <Button onClick={() => startLogin()}>Sign In</Button>
        </Card>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-sm p-6 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
          <h2 className="font-bold text-lg">Access Denied</h2>
          <p className="text-sm text-muted-foreground">You do not have admin privileges.</p>
          <Link href="/"><Button variant="outline">Back to Home</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link href="/"><Button variant="ghost" size="sm" className="gap-1.5 text-xs"><ArrowLeft className="w-3.5 h-3.5" /> Home</Button></Link>
        <span className="font-bold text-[#1a3a6b]">Stampelo Admin</span>
        <Badge variant="secondary" className="ml-auto">Admin</Badge>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Orders" value={stats.totalOrders} sub={`${stats.fulfilledOrders} fulfilled`} />
            <StatCard title="Revenue" value={`$${(stats.totalRevenueCents / 100).toFixed(2)}`} sub="All time" />
            <StatCard title="Customers" value={stats.totalUsers} />
            <StatCard title="Templates" value={`${stats.activeTemplates}/${stats.totalTemplates}`} sub="Active/Total" />
          </div>
        )}
        {stats && stats.failedOrders > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <strong>{stats.failedOrders} fulfillment failure(s)</strong> — review the Orders tab and retry.
          </div>
        )}

        <Tabs defaultValue="orders">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="designs">Designs</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          {/* Orders */}
          <TabsContent value="orders" className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {(["pending", "paid", "fulfilled", "failed"] as const).map((s) => (
                <Button key={s} size="sm" variant={orderFilter === s ? "default" : "outline"}
                  onClick={() => setOrderFilter(orderFilter === s ? undefined : s)}
                  className="capitalize">{s}</Button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm bg-white rounded-lg border">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {["ID", "Email", "Plan", "Amount", "Status", "Created", "Actions"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-slate-600 text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono text-xs">#{o.id}</td>
                      <td className="px-3 py-2 text-xs">{o.email}</td>
                      <td className="px-3 py-2"><Badge variant="outline" className="text-xs">{o.plan.toUpperCase()}</Badge></td>
                      <td className="px-3 py-2 text-xs">${(o.amountCents / 100).toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <Badge variant={o.status === "fulfilled" ? "default" : o.status === "failed" ? "destructive" : "secondary"} className="text-xs">
                          {o.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-2">
                        {(o.status === "failed" || o.status === "paid") && (
                          <Button size="sm" variant="outline" className="h-6 text-xs gap-1"
                            onClick={() => retryFulfillment.mutate({ orderId: o.id })}
                            disabled={retryFulfillment.isPending}>
                            <RefreshCw className="w-3 h-3" /> Retry
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Customers */}
          <TabsContent value="customers" className="space-y-3">
            <Input placeholder="Search by name or email..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="max-w-sm" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm bg-white rounded-lg border">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {["ID", "Name", "Email", "Role", "Joined"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-slate-600 text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono text-xs">#{c.id}</td>
                      <td className="px-3 py-2 text-xs">{c.name ?? "—"}</td>
                      <td className="px-3 py-2 text-xs">{c.email ?? "—"}</td>
                      <td className="px-3 py-2"><Badge variant={c.role === "admin" ? "default" : "outline"} className="text-xs">{c.role}</Badge></td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Designs */}
          <TabsContent value="designs" className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm bg-white rounded-lg border">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {["ID", "Name", "Share Token", "User ID", "Created"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-slate-600 text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {designs.map((d) => (
                    <tr key={d.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono text-xs">#{d.id}</td>
                      <td className="px-3 py-2 text-xs">{d.name ?? "Untitled"}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{d.shareToken}</td>
                      <td className="px-3 py-2 text-xs">{d.userId ?? "Guest"}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Templates */}
          <TabsContent value="templates" className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {templates.map((t) => (
                <Card key={t.id} className={`overflow-hidden ${!t.isActive ? "opacity-50" : ""}`}>
                  {t.thumbnailSvg ? (
                    <div className="aspect-square bg-white p-2 flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: t.thumbnailSvg }} />
                  ) : (
                    <div className="aspect-square bg-slate-100 flex items-center justify-center text-xs text-muted-foreground">No preview</div>
                  )}
                  <CardContent className="p-2">
                    <p className="text-xs font-medium truncate">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.category}</p>
                   <div className="flex items-center justify-between mt-2">
                     <Switch
                        checked={t.isActive ?? false}
                       onCheckedChange={(v) => toggleTemplate.mutate({ id: t.id, active: v })}
                       className="scale-75"
                     />
                      <span className="text-[10px] text-muted-foreground">{t.isActive ? "Active" : "Hidden"}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
