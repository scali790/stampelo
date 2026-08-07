import { useEditorStore } from "./store";
import { createDefaultStamp } from "./store";
import type { CenterTextElement, FrameElement, ImageElement, StampShape, TextOnPathElement } from "./types";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Circle, Square, Triangle, Minus, Type, AlignCenter, Image, Plus, Palette } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const SHAPES: { value: StampShape; label: string; icon: React.ReactNode }[] = [
  { value: "round", label: "Round", icon: <Circle className="w-4 h-4" /> },
  { value: "oval", label: "Oval", icon: <Circle className="w-4 h-4 scale-x-75" /> },
  { value: "rectangular", label: "Rectangle", icon: <Square className="w-4 h-4" /> },
  { value: "triangular", label: "Triangle", icon: <Triangle className="w-4 h-4" /> },
];

export function EditorToolbar() {
  const { getActiveStamp, activeStampId, updateStamp, addElement } = useEditorStore();
  const stamp = getActiveStamp();
  if (!stamp) return null;

  const addFrame = () => {
    const el: FrameElement = {
      id: nanoid(), type: "frame", color: stamp.color, visible: true,
      radius: 80, strokeWidth: 2, lineBreak: 0,
    };
    addElement(activeStampId, el);
  };

  const addTextOnPath = () => {
    const el: TextOnPathElement = {
      id: nanoid(), type: "text-on-path", color: stamp.color, visible: true,
      text: "NEW TEXT", font: "Arial", fontSize: 14, bold: false, italic: false,
      align: "center", inverse: false, radius: 80, letterSpacing: 100, startAngle: 0,
    };
    addElement(activeStampId, el);
  };

  const addCenterText = () => {
    const el: CenterTextElement = {
      id: nanoid(), type: "center-text", color: stamp.color, visible: true,
      text: "TEXT", font: "Arial", fontSize: 16, bold: false, italic: false,
      x: 50, y: 50,
    };
    addElement(activeStampId, el);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b bg-background flex-wrap">
      {/* Shape selector */}
      <div className="flex items-center gap-1.5">
        <Label className="text-xs text-muted-foreground whitespace-nowrap">Shape:</Label>
        <Select
          value={stamp.shape}
          onValueChange={(v) => updateStamp(activeStampId, { shape: v as StampShape })}
        >
          <SelectTrigger className="h-7 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SHAPES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                <span className="flex items-center gap-1.5">{s.icon}{s.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Size */}
      <div className="flex items-center gap-1.5">
        <Label className="text-xs text-muted-foreground">Size:</Label>
        <Input
          type="number" min={10} max={150}
          value={stamp.widthMm}
          onChange={(e) => updateStamp(activeStampId, { widthMm: Number(e.target.value) })}
          className="h-7 w-16 text-xs"
        />
        <span className="text-xs text-muted-foreground">mm</span>
        {(stamp.shape === "oval" || stamp.shape === "rectangular") && (
          <>
            <span className="text-xs text-muted-foreground">×</span>
            <Input
              type="number" min={10} max={150}
              value={stamp.heightMm}
              onChange={(e) => updateStamp(activeStampId, { heightMm: Number(e.target.value) })}
              className="h-7 w-16 text-xs"
            />
            <span className="text-xs text-muted-foreground">mm</span>
          </>
        )}
      </div>

      {/* Global color */}
      <div className="flex items-center gap-1.5">
        <Palette className="w-4 h-4 text-muted-foreground" />
        <input
          type="color" value={stamp.color}
          onChange={(e) => updateStamp(activeStampId, { color: e.target.value })}
          className="w-7 h-7 rounded cursor-pointer border border-border"
          title="Global stamp color"
        />
      </div>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Add elements */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={addFrame}>
            <Circle className="w-3.5 h-3.5" /> Frame
          </Button>
        </TooltipTrigger>
        <TooltipContent>Add frame ring</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={addTextOnPath}>
            <Type className="w-3.5 h-3.5" /> Text on Path
          </Button>
        </TooltipTrigger>
        <TooltipContent>Add text along the stamp border</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={addCenterText}>
            <AlignCenter className="w-3.5 h-3.5" /> Center Text
          </Button>
        </TooltipTrigger>
        <TooltipContent>Add text in the center</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => {}}>
            <Image className="w-3.5 h-3.5" /> Image
          </Button>
        </TooltipTrigger>
        <TooltipContent>Add image / icon</TooltipContent>
      </Tooltip>
    </div>
  );
}

