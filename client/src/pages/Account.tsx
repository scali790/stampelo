import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { startLogin } from "@/const";
import { ArrowLeft, Edit, Download, Clock, CheckCircle, XCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEditorStore } from "@/editor/store";

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    fulfilled: "default",
    paid: "secondary",
    pending: "outline",
    failed: "destructive",
  };
  return <Badge variant={variants[status] ?? "outline"}>{status}</Badge>;
}

export default function Account() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { loadState } = useEditorStore();

  const { data: designs = [] } = trpc.design.myDesigns.useQuery(undefined, { enabled: isAuthenticated });
  const { data: orders = [] } = trpc.order.myOrders.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader><CardTitle>Sign in to access your account</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={() => startLogin()}>Sign In</Button>
            <Link href="/"><Button variant="outline" className="w-full">Back to Home</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 px-4 py-3 border-b">
        <Link href="/"><Button variant="ghost" size="sm" className="gap-1.5 text-xs"><ArrowLeft className="w-3.5 h-3.5" /> Home</Button></Link>
        <span className="text-sm font-semibold">My Account</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{user?.name ?? user?.email}</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <Tabs defaultValue="designs">
          <TabsList className="mb-6">
            <TabsTrigger value="designs">Saved Designs ({designs.length})</TabsTrigger>
            <TabsTrigger value="orders">Purchase History ({orders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="designs">
            {designs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No saved designs yet.</p>
                <Link href="/editor"><Button className="mt-4">Create Your First Stamp</Button></Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {designs.map((design) => (
                  <Card key={design.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                    <div className="aspect-square bg-muted flex items-center justify-center">
                      {design.thumbnailDataUrl ? (
                        <img src={design.thumbnailDataUrl} alt={design.name ?? ""} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xs text-muted-foreground">No preview</span>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <p className="text-sm font-medium truncate">{design.name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(design.createdAt).toLocaleDateString()}</p>
                      <Button
                        size="sm" variant="outline" className="w-full mt-2 gap-1 text-xs"
                        onClick={() => { loadState(design.stateJson as any); navigate("/editor"); }}
                      >
                        <Edit className="w-3 h-3" /> Edit
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders">
            {orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No purchases yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Order #{order.id}</span>
                          <Badge variant="outline">{order.plan.toUpperCase()}</Badge>
                          <StatusBadge status={order.status} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          ${(order.amountCents / 100).toFixed(2)} · {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {order.status === "fulfilled" && (
                        <Link href={`/download?orderId=${order.id}`}>
                          <Button size="sm" variant="outline" className="gap-1.5">
                            <Download className="w-3.5 h-3.5" /> Download
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

