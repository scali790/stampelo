import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { useEditorStore } from "./store";
import { Search } from "lucide-react";
import { TEMPLATE_CATEGORIES } from "../../../shared/templateData";
import { normalizeTemplateState, normalizeTemplateStamp } from "../../../shared/templateStateNormalization";
import { renderStampSvg, CANVAS_SIZE, CANVAS_CENTER } from "./svgUtils";
import type { Stamp } from "./types";

interface PreviewBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Return the actual stamp plate bounds in SVG units instead of previewing the
 * complete 250x250 editor canvas. Without this crop a 38mm round stamp only
 * occupies about 24% of the thumbnail and looks like a tiny ring.
 */
function getPreviewBounds(stamp: Stamp): PreviewBounds {
  const maxR = (stamp.widthMm / 150) * (CANVAS_SIZE / 2) * 0.95;
  const maxRy = (stamp.heightMm / 150) * (CANVAS_SIZE / 2) * 0.95;

  if (stamp.shape === "round" || stamp.shape === "triangular") {
    return {
      x: CANVAS_CENTER - maxR,
      y: CANVAS_CENTER - maxR,
      width: maxR * 2,
      height: maxR * 2,
    };
  }

  return {
    x: CANVAS_CENTER - maxR,
    y: CANVAS_CENTER - maxRy,
    width: maxR * 2,
    height: maxRy * 2,
  };
}

function normalizeSvgForThumbnail(svg: string, bounds?: PreviewBounds) {
  return svg.replace(/<svg\b([^>]*)>/i, (_match, attrs: string) => {
    const cleanAttrs = attrs
      .replace(/\s(?:width|height|viewBox|preserveAspectRatio|style)="[^"]*"/gi, "")
      .trimEnd();
    const viewBox = bounds
      ? `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`
      : "0 0 250 250";

    return `<svg${cleanAttrs} viewBox="${viewBox}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="display:block;width:100%;height:100%">`;
  });
}

// Generate the canonical preview from editable stateJson. Legacy seeded states
// are normalized first because the original catalogue used camelCase element
// type names and omitted heightMm on every stamp.
function TemplateSvgPreview({ stateJson, fallbackSvg }: { stateJson: unknown; fallbackSvg?: string | null }) {
  try {
    const state = normalizeTemplateState(stateJson);
    const stamp = state.stamps[0];
    if (stamp) {
      const svg = normalizeSvgForThumbnail(renderStampSvg(stamp), getPreviewBounds(stamp));
      return <PreviewFrame svg={svg} />;
    }
  } catch (error) {
    console.error("[TemplateSvgPreview] render failed", error);
  }

  if (fallbackSvg) {
    return <PreviewFrame svg={normalizeSvgForThumbnail(fallbackSvg)} />;
  }

  return <NoPreview />;
}

function PreviewFrame({ svg }: { svg: string }) {
  return (
    <div
      className="w-full h-28 bg-white rounded mb-1 overflow-hidden flex items-center justify-center p-2"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function NoPreview() {
  return (
    <div className="w-full h-28 bg-muted rounded mb-1 flex items-center justify-center text-xs text-muted-foreground">
      No preview
    </div>
  );
}

interface Props { open: boolean; onClose: () => void; }

export function TemplateDrawer({ open, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const { loadState } = useEditorStore();

  const [page, setPage] = useState(1);
  const { data: result, error, isLoading } = trpc.template.list.useQuery({ category, search, page, pageSize: 24 });
  const templates = result?.items ?? [];
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 1;

  const handleLoad = (template: typeof templates[number]) => {
    if (template.stateJson) {
      loadState(normalizeTemplateState(template.stateJson));
    }
    onClose();
  };

  const selectCategory = (nextCategory?: string) => {
    setCategory(nextCategory);
    setPage(1);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="left" className="w-96 p-0 h-full flex flex-col overflow-hidden">
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <SheetTitle>Template Library</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-3 border-b space-y-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <ScrollArea className="w-full">
              <div className="flex gap-1.5 pb-1">
                <Button
                  size="sm" variant={!category ? "default" : "outline"}
                  className="h-6 text-xs whitespace-nowrap"
                  onClick={() => selectCategory(undefined)}
                >All</Button>
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <Button
                    key={cat} size="sm"
                    variant={category === cat ? "default" : "outline"}
                    className="h-6 text-xs whitespace-nowrap"
                    onClick={() => selectCategory(cat)}
                  >{cat}</Button>
                ))}
              </div>
            </ScrollArea>
            <div className="text-[11px] text-muted-foreground">
              {isLoading ? "Loading templates…" : error ? "Template service unavailable" : total > 0 ? `${total} template${total === 1 ? "" : "s"}` : "No templates"}
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            {error ? (
              <div className="p-8 text-center text-sm text-destructive">
                Templates could not be loaded. Please try again.
              </div>
            ) : templates.length === 0 && !isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No templates found.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-3">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className="border rounded-lg p-2 cursor-pointer hover:border-primary hover:bg-accent/30 transition-all"
                    onClick={() => handleLoad(t)}
                  >
                    <TemplateSvgPreview stateJson={t.stateJson} fallbackSvg={t.thumbnailSvg} />
                    <p className="text-xs font-medium truncate">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.category}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 border-t text-xs shrink-0 bg-background">
              <Button size="sm" variant="outline" className="h-6 text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <span className="text-muted-foreground">Page {page} / {totalPages}</span>
              <Button size="sm" variant="outline" className="h-6 text-xs" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
