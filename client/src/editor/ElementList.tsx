import { useEditorStore } from "./store";
import type { StampElement } from "./types";
import { Eye, EyeOff, ChevronUp, ChevronDown, Copy, Trash2, Type, Circle, Image, AlignCenter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function elementIcon(type: StampElement["type"]) {
  switch (type) {
    case "frame": return <Circle className="w-3.5 h-3.5" />;
    case "text-on-path": return <Type className="w-3.5 h-3.5" />;
    case "center-text": return <AlignCenter className="w-3.5 h-3.5" />;
    case "image": return <Image className="w-3.5 h-3.5" />;
  }
}

function elementLabel(el: StampElement): string {
  switch (el.type) {
    case "frame": return "Frame Ring";
    case "text-on-path": return el.text || "Text on Path";
    case "center-text": return el.text || "Center Text";
    case "image": return "Image";
  }
}

export function ElementList() {
  const {
    getActiveStamp,
    activeStampId,
    selectedElementId,
    setSelectedElement,
    removeElement,
    duplicateElement,
    moveElementUp,
    moveElementDown,
    updateElement,
  } = useEditorStore();

  const stamp = getActiveStamp();
  if (!stamp) return null;

  const elements = [...stamp.elements].reverse(); // Show top layer first

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
        Layers
      </div>
      <div className="flex-1 overflow-y-auto">
        {elements.map((el) => (
          <div
            key={el.id}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1.5 cursor-pointer hover:bg-accent/50 group border-b border-border/30",
              selectedElementId === el.id && "bg-primary/10 border-l-2 border-l-primary"
            )}
            onClick={() => setSelectedElement(el.id)}
          >
            <span className="text-muted-foreground">{elementIcon(el.type)}</span>
            <span className="flex-1 text-xs truncate">{elementLabel(el)}</span>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="p-0.5 hover:text-primary"
                onClick={(e) => { e.stopPropagation(); updateElement(activeStampId, el.id, { visible: !el.visible }); }}
                title={el.visible ? "Hide" : "Show"}
              >
                {el.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>
              <button
                className="p-0.5 hover:text-primary"
                onClick={(e) => { e.stopPropagation(); moveElementUp(activeStampId, el.id); }}
                title="Move up"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                className="p-0.5 hover:text-primary"
                onClick={(e) => { e.stopPropagation(); moveElementDown(activeStampId, el.id); }}
                title="Move down"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
              <button
                className="p-0.5 hover:text-primary"
                onClick={(e) => { e.stopPropagation(); duplicateElement(activeStampId, el.id); }}
                title="Duplicate"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                className="p-0.5 hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); removeElement(activeStampId, el.id); }}
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        {elements.length === 0 && (
          <div className="p-4 text-xs text-muted-foreground text-center">
            No elements yet. Use the toolbar above to add elements.
          </div>
        )}
      </div>
    </div>
  );
}

