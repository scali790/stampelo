import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEditorStore } from "./store";
import { renderStampSvg, CANVAS_SIZE } from "./svgUtils";

interface Props { open: boolean; onClose: () => void; }

export function PreviewModal({ open, onClose }: Props) {
  const { getActiveStamp } = useEditorStore();
  const stamp = getActiveStamp();

  if (!stamp) return null;

  const svgWithWatermark = renderStampSvg(stamp, { watermark: true });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Stamp Preview</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div
            className="border rounded-lg shadow-inner bg-white p-4"
            dangerouslySetInnerHTML={{ __html: svgWithWatermark.replace(
              `width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"`,
              `width="300" height="300"`
            )}}
          />
          <p className="text-xs text-muted-foreground text-center">
            This is a watermarked preview. Purchase a plan to download the clean version.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

