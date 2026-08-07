import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Copy, Mail } from "lucide-react";
import { useEditorStore } from "./store";

interface Props { open: boolean; onClose: () => void; }

export function ShareModal({ open, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const { stamps, activeStampId, locale } = useEditorStore();

  const saveDesign = trpc.design.save.useMutation({
    onSuccess: (data: { shareToken: string }) => {
      const url = `${window.location.origin}/editor?design=${data.shareToken}`;
      setShareUrl(url);
    },
    onError: () => toast.error("Failed to save design"),
  });

  const sendEmail = trpc.design.sendEmail.useMutation({
    onSuccess: () => { toast.success("Link sent to your email!"); onClose(); },
    onError: () => toast.error("Failed to send email"),
  });

  const handleSave = () => {
    saveDesign.mutate({ stateJson: { stamps, activeStampId, locale } });
  };

  const handleSendEmail = () => {
    if (!email || !shareUrl) return;
    sendEmail.mutate({ email, shareUrl });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Save & Share Design</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!shareUrl ? (
            <Button onClick={handleSave} disabled={saveDesign.isPending} className="w-full">
              {saveDesign.isPending ? "Saving..." : "Generate Share Link"}
            </Button>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs">Share Link</Label>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="text-xs" />
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Copied!"); }}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-xs">Send link by email</Label>
            <div className="flex gap-2">
              <Input
                type="email" placeholder="your@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="text-xs"
              />
              <Button size="sm" onClick={handleSendEmail} disabled={!shareUrl || !email || sendEmail.isPending}>
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
