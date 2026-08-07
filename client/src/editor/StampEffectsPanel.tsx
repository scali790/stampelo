import { useEditorStore } from "./store";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";

export function StampEffectsPanel() {
  const { getActiveStamp, activeStampId, updateStamp } = useEditorStore();
  const stamp = getActiveStamp();
  if (!stamp) return null;

  const toggle = (effect: "shabby" | "gold" | "silver") => {
    const effects = { ...stamp.effects };
    effects[effect] = !effects[effect];
    // Gold and silver are mutually exclusive
    if (effect === "gold" && effects.gold) effects.silver = false;
    if (effect === "silver" && effects.silver) effects.gold = false;
    updateStamp(activeStampId, { effects });
  };

  return (
    <div className="px-3 py-3 border-t space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        <Sparkles className="w-3.5 h-3.5" /> Effects
      </div>
      {(["shabby", "gold", "silver"] as const).map((effect) => (
        <div key={effect} className="flex items-center justify-between">
          <Label className="text-xs capitalize cursor-pointer" htmlFor={`effect-${effect}`}>
            {effect === "shabby" ? "Shabby / Aged" : effect === "gold" ? "Gold Metallic" : "Silver Metallic"}
          </Label>
          <Switch
            id={`effect-${effect}`}
            checked={stamp.effects[effect]}
            onCheckedChange={() => toggle(effect)}
          />
        </div>
      ))}
    </div>
  );
}

