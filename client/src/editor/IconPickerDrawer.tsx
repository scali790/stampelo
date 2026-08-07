import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { useEditorStore } from "./store";
import { Search, Upload } from "lucide-react";
import { nanoid } from "nanoid";
import type { ImageElement } from "./types";
import { toast } from "sonner";
import { ICON_CATEGORIES } from "../../../shared/iconData";

interface Props { open: boolean; onClose: () => void; }

export function IconPickerDrawer({ open, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const { addElement, activeStampId, getActiveStamp } = useEditorStore();

  const { data: icons = [] } = trpc.icon.list.useQuery({ category, search });

  const handleAddIcon = (icon: typeof icons[number]) => {
    const stamp = getActiveStamp();
    const el: ImageElement = {
      id: nanoid(),
      type: "image",
      color: stamp?.color ?? "#1a3a6b",
      visible: true,
      svgContent: `<path d="${icon.path}" fill="currentColor"/>`,
      scale: 100,
      x: 50,
      y: 50,
    };
    addElement(activeStampId, el);
    onClose();
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".svg")) {
      toast.error("Only SVG files are supported");
      return;
    }
    if (file.size > 50 * 1024) {
      toast.error("File must be smaller than 50 KB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const svgText = ev.target?.result as string;
      // Basic client-side sanitisation: strip scripts
      const sanitised = svgText
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/on\w+="[^"]*"/gi, "")
        .replace(/javascript:/gi, "");
      const stamp = getActiveStamp();
      const el: ImageElement = {
        id: nanoid(),
        type: "image",
        color: stamp?.color ?? "#1a3a6b",
        visible: true,
        svgContent: sanitised,
        scale: 100,
        x: 50,
        y: 50,
      };
      addElement(activeStampId, el);
      onClose();
    };
    reader.readAsText(file);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="left" className="w-96 p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle>Icon Library</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-full">
          <div className="p-3 border-b space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search icons..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer border rounded px-3 py-1.5 hover:bg-accent/30 text-xs">
              <Upload className="w-3.5 h-3.5" />
              Upload custom SVG (max 50 KB)
              <input type="file" accept=".svg" className="hidden" onChange={handleUpload} />
            </label>
            <ScrollArea className="w-full">
              <div className="flex gap-1.5 pb-1">
                <Button
                  size="sm" variant={!category ? "default" : "outline"}
                  className="h-6 text-xs whitespace-nowrap"
                  onClick={() => setCategory(undefined)}
                >All</Button>
                {ICON_CATEGORIES.map((cat) => (
                  <Button
                    key={cat} size="sm"
                    variant={category === cat ? "default" : "outline"}
                    className="h-6 text-xs whitespace-nowrap"
                    onClick={() => setCategory(cat)}
                  >{cat}</Button>
                ))}
              </div>
            </ScrollArea>
          </div>
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-4 gap-2 p-3">
              {icons.map((icon) => (
                <button
                  key={icon.id}
                  className="flex flex-col items-center gap-1 p-2 border rounded hover:border-primary hover:bg-accent/30 transition-all"
                  onClick={() => handleAddIcon(icon)}
                  title={icon.name}
                >
                  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-foreground">
                    <path d={icon.path} />
                  </svg>
                  <span className="text-[9px] text-muted-foreground truncate w-full text-center">{icon.name}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
