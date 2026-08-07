import { useEditorStore } from "./store";
import { renderStampSvg, CANVAS_SIZE } from "./svgUtils";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function StampThumbnailList() {
  const { stamps, activeStampId, setActiveStamp, addStamp, removeStamp } = useEditorStore();

  return (
    <div className="flex flex-col gap-2 p-2 border-r bg-muted/30 w-20 min-w-[5rem] overflow-y-auto">
      {stamps.map((stamp) => {
        const svg = renderStampSvg(stamp);
        return (
          <div
            key={stamp.id}
            className={cn(
              "relative group cursor-pointer rounded border-2 transition-all",
              activeStampId === stamp.id
                ? "border-primary shadow-md"
                : "border-transparent hover:border-border"
            )}
            onClick={() => setActiveStamp(stamp.id)}
          >
            <div
              className="w-full aspect-square bg-white rounded"
              dangerouslySetInnerHTML={{ __html: svg.replace(
                `width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"`,
                `width="100%" height="100%"`
              )}}
            />
            {stamps.length > 1 && (
              <button
                className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                onClick={(e) => { e.stopPropagation(); removeStamp(stamp.id); }}
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        );
      })}
      <Button
        size="sm" variant="outline"
        className="w-full h-8 text-xs gap-1"
        onClick={() => addStamp()}
        title="Add new stamp"
      >
        <Plus className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

