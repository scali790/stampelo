import { useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileImage, FileText, FileCode, File, CheckCircle, Clock, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const FORMAT_ICONS: Record<string, React.ReactNode> = {
  png: <FileImage className="w-5 h-5" />,
  svg: <FileCode className="w-5 h-5" />,
  pdf: <FileText className="w-5 h-5" />,
  docx: <File className="w-5 h-5" />,
  eps: <FileCode className="w-5 h-5" />,
};

export default function DownloadPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const sessionId = params.get("session_id");
  const orderId = params.get("orderId");
  const orderIdNum = orderId ? parseInt(orderId, 10) : null;

  const { data: orderBySession, isLoading: loadingSession } = trpc.order.getBySession.useQuery(
    { sessionId: sessionId! },
    { enabled: !!sessionId, refetchInterval: (query) => (query.state.data?.status === "fulfilled" ? false : 3000) }
  );

  const { data: orderById, isLoading: loadingOrderId } = trpc.order.getByOrderId.useQuery(
    { orderId: orderIdNum! },
    { enabled: !!orderIdNum && !sessionId }
  );

  const order = orderBySession ?? orderById;
  const isLoading = loadingSession || loadingOrderId;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Clock className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <h2 className="text-xl font-semibold">Processing your order...</h2>
          <p className="text-muted-foreground">This usually takes less than 30 seconds.</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Order not found</h2>
          <Link href="/"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Home</Button></Link>
        </div>
      </div>
    );
  }

  const links = (order.downloadLinks as Array<{ format: string; key: string }>) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          {order.status === "fulfilled" ? (
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
          ) : (
            <Clock className="w-12 h-12 text-primary mx-auto mb-2 animate-pulse" />
          )}
          <CardTitle>
            {order.status === "fulfilled" ? "Your stamp is ready!" : "Preparing your stamp..."}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Order #{order.id} — <Badge variant="outline">{order.plan.toUpperCase()}</Badge>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.status === "fulfilled" && links.length > 0 ? (
            <>
              <p className="text-sm text-center text-muted-foreground">
                Download links have also been sent to <strong>{order.email}</strong>
              </p>
              <div className="space-y-2">
                {links.map((link) => (
                  <a
                    key={link.format}
                    href={`/api/download/${link.key}`}
                    download
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {FORMAT_ICONS[link.format] ?? <File className="w-5 h-5" />}
                      <span className="font-medium uppercase">{link.format}</span>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Download className="w-3.5 h-3.5" /> Download
                    </Button>
                  </a>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                {order.status === "paid"
                  ? "Your files are being generated. This page will update automatically."
                  : order.status === "failed"
                  ? "There was an error processing your order. Please contact support@stampelo.com"
                  : "Waiting for payment confirmation..."}
              </p>
            </div>
          )}
          <div className="pt-2 border-t">
            <Link href="/editor">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Editor
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
