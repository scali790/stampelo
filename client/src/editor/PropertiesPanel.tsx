import { useEditorStore } from "./store";
import { AVAILABLE_FONTS, FONT_SIZES } from "./types";
import type { CenterTextElement, FrameElement, ImageElement, TextOnPathElement } from "./types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, FlipVertical } from "lucide-react";

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-3 py-2 border-b border-border/30">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SliderProp({
  label, value, min, max, step = 1, onChange, displayValue,
}: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; displayValue?: string;
}) {
  return (
    <PropRow label={`${label} [${displayValue ?? value}]`}>
      <Slider
        min={min} max={max} step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v!)}
        className="w-full"
      />
    </PropRow>
  );
}

function ColorProp({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <PropRow label={label}>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-border" />
        <Input value={value} onChange={(e) => onChange(e.target.value)}
          className="h-7 text-xs font-mono flex-1" maxLength={7} />
      </div>
    </PropRow>
  );
}

function FontProp({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <PropRow label="Font">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent className="max-h-48">
          {AVAILABLE_FONTS.map((f) => (
            <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </PropRow>
  );
}

function FontSizeProp({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <PropRow label="Size">
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {FONT_SIZES.map((s) => (
            <SelectItem key={s} value={String(s)}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </PropRow>
  );
}

function TextFormattingProp({
  bold, italic, align, inverse,
  onBold, onItalic, onAlign, onInverse,
}: {
  bold: boolean; italic: boolean; align: "left" | "center" | "right"; inverse?: boolean;
  onBold: (v: boolean) => void; onItalic: (v: boolean) => void;
  onAlign: (v: "left" | "center" | "right") => void; onInverse?: (v: boolean) => void;
}) {
  return (
    <PropRow label="Formatting">
      <div className="flex items-center gap-1 flex-wrap">
        <Toggle size="sm" pressed={bold} onPressedChange={onBold} title="Bold"><Bold className="w-3.5 h-3.5" /></Toggle>
        <Toggle size="sm" pressed={italic} onPressedChange={onItalic} title="Italic"><Italic className="w-3.5 h-3.5" /></Toggle>
        <Toggle size="sm" pressed={align === "left"} onPressedChange={() => onAlign("left")} title="Left"><AlignLeft className="w-3.5 h-3.5" /></Toggle>
        <Toggle size="sm" pressed={align === "center"} onPressedChange={() => onAlign("center")} title="Center"><AlignCenter className="w-3.5 h-3.5" /></Toggle>
        <Toggle size="sm" pressed={align === "right"} onPressedChange={() => onAlign("right")} title="Right"><AlignRight className="w-3.5 h-3.5" /></Toggle>
        {onInverse && (
          <Toggle size="sm" pressed={inverse} onPressedChange={onInverse} title="Inverse"><FlipVertical className="w-3.5 h-3.5" /></Toggle>
        )}
      </div>
    </PropRow>
  );
}

// ─── Frame properties ─────────────────────────────────────────────────────────
function FrameProps({ el }: { el: FrameElement }) {
  const { activeStampId, updateElement } = useEditorStore();
  const upd = (updates: Partial<FrameElement>) => updateElement(activeStampId, el.id, updates);
  return (
    <>
      <SliderProp label="Radius" value={el.radius} min={10} max={100} onChange={(v) => upd({ radius: v })} />
      <SliderProp label="Stroke Width" value={el.strokeWidth} min={0.5} max={20} step={0.5} onChange={(v) => upd({ strokeWidth: v })} />
      <SliderProp label="Line Break" value={el.lineBreak} min={0} max={180} onChange={(v) => upd({ lineBreak: v })} />
      <ColorProp label="Color" value={el.color} onChange={(v) => upd({ color: v })} />
    </>
  );
}

// ─── Text on path properties ──────────────────────────────────────────────────
function TextOnPathProps({ el }: { el: TextOnPathElement }) {
  const { activeStampId, updateElement } = useEditorStore();
  const upd = (updates: Partial<TextOnPathElement>) => updateElement(activeStampId, el.id, updates);
  return (
    <>
      <PropRow label="Text">
        <Input value={el.text} onChange={(e) => upd({ text: e.target.value })}
          className="h-7 text-xs" placeholder="Text on path..." />
      </PropRow>
      <FontProp value={el.font} onChange={(v) => upd({ font: v })} />
      <FontSizeProp value={el.fontSize} onChange={(v) => upd({ fontSize: v })} />
      <TextFormattingProp
        bold={el.bold} italic={el.italic} align={el.align} inverse={el.inverse}
        onBold={(v) => upd({ bold: v })} onItalic={(v) => upd({ italic: v })}
        onAlign={(v) => upd({ align: v })} onInverse={(v) => upd({ inverse: v })}
      />
      <SliderProp label="Radius" value={el.radius} min={10} max={100} onChange={(v) => upd({ radius: v })} />
      <SliderProp label="Letter Spacing" value={el.letterSpacing} min={50} max={200} onChange={(v) => upd({ letterSpacing: v })} />
      <SliderProp label="Start Angle" value={el.startAngle} min={-180} max={180} onChange={(v) => upd({ startAngle: v })} />
      <ColorProp label="Color" value={el.color} onChange={(v) => upd({ color: v })} />
    </>
  );
}

// ─── Center text properties ───────────────────────────────────────────────────
function CenterTextProps({ el }: { el: CenterTextElement }) {
  const { activeStampId, updateElement } = useEditorStore();
  const upd = (updates: Partial<CenterTextElement>) => updateElement(activeStampId, el.id, updates);
  return (
    <>
      <PropRow label="Text">
        <Input value={el.text} onChange={(e) => upd({ text: e.target.value })}
          className="h-7 text-xs" placeholder="Center text..." />
      </PropRow>
      <FontProp value={el.font} onChange={(v) => upd({ font: v })} />
      <FontSizeProp value={el.fontSize} onChange={(v) => upd({ fontSize: v })} />
      <TextFormattingProp
        bold={el.bold} italic={el.italic} align="center"
        onBold={(v) => upd({ bold: v })} onItalic={(v) => upd({ italic: v })}
        onAlign={() => {}}
      />
      <SliderProp label="X Position" value={el.x} min={0} max={100} onChange={(v) => upd({ x: v })} />
      <SliderProp label="Y Position" value={el.y} min={0} max={100} onChange={(v) => upd({ y: v })} />
      <ColorProp label="Color" value={el.color} onChange={(v) => upd({ color: v })} />
    </>
  );
}

// ─── Image properties ─────────────────────────────────────────────────────────
function ImageProps({ el }: { el: ImageElement }) {
  const { activeStampId, updateElement } = useEditorStore();
  const upd = (updates: Partial<ImageElement>) => updateElement(activeStampId, el.id, updates);
  return (
    <>
      <SliderProp label="Scale" value={el.scale} min={10} max={200} onChange={(v) => upd({ scale: v })} />
      <SliderProp label="X Position" value={el.x} min={0} max={100} onChange={(v) => upd({ x: v })} />
      <SliderProp label="Y Position" value={el.y} min={0} max={100} onChange={(v) => upd({ y: v })} />
      <ColorProp label="Color" value={el.color} onChange={(v) => upd({ color: v })} />
    </>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export function PropertiesPanel() {
  const { getSelectedElement } = useEditorStore();
  const el = getSelectedElement();

  if (!el) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
          Properties
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-muted-foreground text-center">
            Select an element from the layers panel to edit its properties.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b sticky top-0 bg-background z-10">
        Properties — {el.type.replace(/-/g, " ")}
      </div>
      {el.type === "frame" && <FrameProps el={el} />}
      {el.type === "text-on-path" && <TextOnPathProps el={el} />}
      {el.type === "center-text" && <CenterTextProps el={el} />}
      {el.type === "image" && <ImageProps el={el} />}
    </div>
  );
}

