import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Edit, Download, Mail } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEditorStore } from "@/editor/store";
import { useState } from "react";
import { toast } from "sonner";

async function getCsrfToken(): Promise<string> {
  try {
    const res = await fetch("/api/auth/csrf");
    const data = await res.json();
    return data.csrfToken ?? "";
  } catch {
    return "";
  }
}

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
  // ── ALL hooks must be declared unconditionally at the top ──────────────────
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { loadState } = useEditorStore();

  // Sign-in form state — declared before any conditional return
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  // Data queries — enabled flag prevents actual fetches when not authenticated
  const { data: designs = [] } = trpc.design.myDesigns.useQuery(undefined, { enabled: isAuthenticated });
  const { data: orders = [] } = trpc.order.myOrders.useQuery(undefined, { enabled: isAuthenticated });
  // ── End of hooks ───────────────────────────────────────────────────────────

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSigningIn(true);
    try {
      const res = await fetch("/api/auth/signin/resend", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          email: email.trim(),
          callbackUrl: window.location.origin,
          csrfToken: await getCsrfToken(),
        }),
      });
      if (res.ok || res.redirected) {
        setEmailSent(true);
      } else {
        toast.error("Failed to send sign-in email. Please try again.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSigningIn(false);
    }
  };

  // ── Conditional renders (after all hooks) ─────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-center">Sign in to Stampelo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {emailSent ? (
              <div className="text-center py-4 space-y-2">
                <Mail className="w-10 h-10 mx-auto text-primary" />
                <p className="font-medium">Check your email</p>
                <p className="text-sm text-muted-foreground">
                  We sent a sign-in link to <strong>{email}</strong>
                </p>
                <Button variant="outline" className="w-full mt-2" onClick={() => setEmailSent(false)}>
                  Use a different email
                </Button>
              </div>
            ) : (
              <>
                {/* Google OAuth */}
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  onClick={() => {
                    window.location.href = `/api/auth/signin/google?callbackUrl=${encodeURIComponent(window.location.origin)}`;
                  }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                {/* Email magic link */}
                <form onSubmit={handleEmailSignIn} className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" className="w-full gap-2" disabled={signingIn}>
                    <Mail className="w-4 h-4" />
                    {signingIn ? "Sending..." : "Continue with Email"}
                  </Button>
                </form>

                <Link href="/">
                  <Button variant="ghost" className="w-full text-muted-foreground">Back to Home</Button>
                </Link>
              </>
            )}
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
