import { StampCanvas } from "@/editor/StampCanvas";
import { ElementList } from "@/editor/ElementList";
import { PropertiesPanel } from "@/editor/PropertiesPanel";
import { EditorToolbar } from "@/editor/EditorToolbar";
import { StampThumbnailList } from "@/editor/StampThumbnailList";
import { StampEffectsPanel } from "@/editor/StampEffectsPanel";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/editor/store";
import { renderStampSvg } from "@/editor/svgUtils";
import { Download, Eye, Share2, Save, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { PreviewModal } from "@/editor/PreviewModal";
import { DownloadModal } from "@/editor/DownloadModal";
import { ShareModal } from "@/editor/ShareModal";
import { TemplateDrawer } from "@/editor/TemplateDrawer";
import { IconPickerDrawer } from "@/editor/IconPickerDrawer";
import { LayoutTemplate } from "lucide-react";
import { useIsMobile } from "@/hooks/useMobile";
import { Layers, Settings } from "lucide-react";

export default function Editor() {
  const { getActiveStamp } = useEditorStore();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const isMobile = useIsMobile();
  const [mobilePanel, setMobilePanel] = useState<"layers" | "properties" | null>(null);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Top nav bar */}
      <header className="flex items-center justify-between px-3 py-2 border-b bg-background z-20 shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/"><Button variant="ghost" size="sm" className="gap-1 text-xs px-2"><ArrowLeft className="w-3.5 h-3.5" />{!isMobile && "Stampelo"}</Button></Link>
          {!isMobile && <span className="text-muted-foreground text-xs">|</span>}
          <span className="text-sm font-semibold truncate">Stamp Editor</span>
          <Button variant="outline" size="sm" className="gap-1 text-xs h-7 px-2" onClick={() => setTemplateOpen(true)}>
            <LayoutTemplate className="w-3 h-3" />{!isMobile && " Templates"}
          </Button>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isMobile && (
            <>
              <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => setMobilePanel(mobilePanel === "layers" ? null : "layers")}><Layers className="w-3.5 h-3.5" /></Button>
              <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => setMobilePanel(mobilePanel === "properties" ? null : "properties")}><Settings className="w-3.5 h-3.5" /></Button>
            </>
          )}
          <Button variant="outline" size="sm" className="gap-1 text-xs h-7 px-2" onClick={() => setPreviewOpen(true)}><Eye className="w-3.5 h-3.5" />{!isMobile && " Preview"}</Button>
          {!isMobile && <Button variant="outline" size="sm" className="gap-1 text-xs h-7 px-2" onClick={() => setShareOpen(true)}><Share2 className="w-3.5 h-3.5" /> Share</Button>}
          <Button size="sm" className="gap-1 text-xs h-7 px-2 bg-primary" onClick={() => setDownloadOpen(true)}><Download className="w-3.5 h-3.5" />{!isMobile && " Download"}</Button>
        </div>
      </header>

      {/* Toolbar */}
      <EditorToolbar />

      {/* Main editor area */}
      <div className="flex flex-1 min-h-0 relative">
        {!isMobile && <StampThumbnailList />}
        <StampCanvas />
        {!isMobile && (
          <div className="flex flex-col w-64 min-w-[16rem] border-l bg-background overflow-hidden">
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <div className="h-48 border-b overflow-hidden flex flex-col"><ElementList /></div>
              <div className="flex-1 min-h-0 overflow-y-auto"><PropertiesPanel /></div>
            </div>
            <StampEffectsPanel />
          </div>
        )}
        {isMobile && mobilePanel && (
          <div className="absolute right-0 top-0 bottom-0 w-72 max-w-[85vw] bg-background border-l shadow-xl z-30 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <span className="text-sm font-semibold capitalize">{mobilePanel === "layers" ? "Layers" : "Properties"}</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setMobilePanel(null)}>✕</Button>
            </div>
            {mobilePanel === "layers" && <div className="flex-1 overflow-y-auto"><ElementList /></div>}
            {mobilePanel === "properties" && <div className="flex-1 overflow-y-auto flex flex-col"><PropertiesPanel /><StampEffectsPanel /></div>}
          </div>
        )}
      </div>

      {/* Modals */}
      <PreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} />
      <DownloadModal open={downloadOpen} onClose={() => setDownloadOpen(false)} />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
      <TemplateDrawer open={templateOpen} onClose={() => setTemplateOpen(false)} />
      <IconPickerDrawer open={iconPickerOpen} onClose={() => setIconPickerOpen(false)} />
    </div>
  );
}
