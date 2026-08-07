import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useEditorStore } from "./store";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Props { open: boolean; onClose: () => void; }

const PLANS = [
  {
    id: "promo" as const,
    name: "PROMO",
    price: "$2.50",
    cents: 250,
    formats: ["PNG"],
    highlight: false,
    description: "High quality PNG with transparent background",
  },
  {
    id: "econom" as const,
    name: "ECONOM",
    price: "$3.50",
    cents: 350,
    formats: ["SVG", "PNG"],
    highlight: false,
    description: "Scalable vector + PNG",
  },
  {
    id: "premium" as const,
    name: "PREMIUM",
    price: "$4.50",
    cents: 450,
    formats: ["PDF", "SVG", "PNG"],
    highlight: true,
    description: "PDF + SVG + PNG — ready for print",
  },
  {
    id: "vip" as const,
    name: "VIP WORD",
    price: "$5.50",
    cents: 550,
    formats: ["DOCX", "PDF", "SVG", "PNG"],
    highlight: false,
    description: "Word document + all formats",
  },
];

export function DownloadModal({ open, onClose }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[number] | null>(null);
  const [email, setEmail] = useState("");
  const { stamps, activeStampId, locale } = useEditorStore();

  const checkout = trpc.order.createCheckout.useMutation({
    onSuccess: (data: { checkoutUrl: string }) => {
      window.open(data.checkoutUrl, "_blank");
      toast.success("Redirecting to payment...");
      onClose();
    },
    onError: () => toast.error("Failed to create checkout session"),
  });

  const handleCheckout = () => {
    if (!selectedPlan || !email) return;
    checkout.mutate({
      plan: selectedPlan.id,
      email,
      stateJson: { stamps, activeStampId, locale },
      amountCents: selectedPlan.cents,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Download Your Stamp</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Plan selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "relative border-2 rounded-lg p-3 cursor-pointer transition-all hover:border-primary",
                  selectedPlan?.id === plan.id ? "border-primary bg-primary/5" : "border-border",
                  plan.highlight && "ring-2 ring-primary/30"
                )}
                onClick={() => setSelectedPlan(plan)}
              >
                {plan.highlight && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] px-1.5 py-0">Popular</Badge>
                )}
                {selectedPlan?.id === plan.id && (
                  <Check className="absolute top-2 right-2 w-4 h-4 text-primary" />
                )}
                <div className="font-bold text-sm">{plan.name}</div>
                <div className="text-xl font-bold text-primary mt-1">{plan.price}</div>
                <div className="mt-2 space-y-0.5">
                  {plan.formats.map((f) => (
                    <div key={f} className="text-xs text-muted-foreground flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-500" /> {f}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">{plan.description}</p>
              </div>
            ))}
          </div>

          {/* Email input */}
          <div className="space-y-1.5">
            <Label className="text-sm">Email address (download link will be sent here)</Label>
            <Input
              type="email" placeholder="your@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            disabled={!selectedPlan || !email || checkout.isPending}
            onClick={handleCheckout}
          >
            {checkout.isPending ? "Processing..." : `Pay ${selectedPlan?.price ?? ""} & Download`}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Secure payment via Stripe. Download link sent to your email after payment.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
