import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { useEditorStore } from "./store";
import { Search } from "lucide-react";
import { TEMPLATE_CATEGORIES } from "../../../shared/templateData";

interface Props { open: boolean; onClose: () => void; }

export function TemplateDrawer({ open, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const { loadState } = useEditorStore();

  const [page, setPage] = useState(1);
  const { data: result } = trpc.template.list.useQuery({ category, search, page, pageSize: 24 });
  const templates = result?.items ?? [];
  const totalPages = result?.totalPages ?? 1;

  const handleLoad = (template: typeof templates[number]) => {
    if (template.stateJson) {
      loadState(template.stateJson as any);
    }
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="left" className="w-96 p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle>Template Library</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-full">
          <div className="p-3 border-b space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <ScrollArea className="w-full">
              <div className="flex gap-1.5 pb-1">
                <Button
                  size="sm" variant={!category ? "default" : "outline"}
                  className="h-6 text-xs whitespace-nowrap"
                  onClick={() => setCategory(undefined)}
                >All</Button>
                {TEMPLATE_CATEGORIES.map((cat) => (
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
            {templates.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No templates found. Templates will appear here once added by an admin.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-3">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className="border rounded-lg p-2 cursor-pointer hover:border-primary hover:bg-accent/30 transition-all"
                    onClick={() => handleLoad(t)}
                  >
                    {t.thumbnailSvg ? (
                      <div
                        className="w-full aspect-square bg-white rounded mb-1"
                        dangerouslySetInnerHTML={{ __html: t.thumbnailSvg }}
                      />
                    ) : (
                      <div className="w-full aspect-square bg-muted rounded mb-1 flex items-center justify-center text-xs text-muted-foreground">
                        No preview
                      </div>
                    )}
                    <p className="text-xs font-medium truncate">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.category}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 border-t text-xs">
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
