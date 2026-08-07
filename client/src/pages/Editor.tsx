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

export default function Editor() {
  const { getActiveStamp } = useEditorStore();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Top nav bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b bg-background z-20 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Stampelo
          </Button>
        </Link>
        <span className="text-muted-foreground text-xs">|</span>
        <span className="text-sm font-semibold">Stamp Editor</span>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 ml-2" onClick={() => setTemplateOpen(true)}>
          <LayoutTemplate className="w-3.5 h-3.5" /> Templates
        </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => setPreviewOpen(true)}>
            <Eye className="w-3.5 h-3.5" /> Preview
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => setShareOpen(true)}>
            <Share2 className="w-3.5 h-3.5" /> Share
          </Button>
          <Button size="sm" className="gap-1.5 text-xs h-8 bg-primary" onClick={() => setDownloadOpen(true)}>
            <Download className="w-3.5 h-3.5" /> Download Stamp
          </Button>
        </div>
      </header>

      {/* Toolbar */}
      <EditorToolbar />

      {/* Main editor area */}
      <div className="flex flex-1 min-h-0">
        {/* Stamp thumbnail list (left side) */}
        <StampThumbnailList />

        {/* Canvas (center) */}
        <StampCanvas />

        {/* Right panel: layers + properties + effects */}
        <div className="flex flex-col w-64 min-w-[16rem] border-l bg-background overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {/* Layers panel — fixed height */}
            <div className="h-48 border-b overflow-hidden flex flex-col">
              <ElementList />
            </div>
            {/* Properties panel — fills remaining space */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <PropertiesPanel />
            </div>
          </div>
          {/* Effects panel — bottom */}
          <StampEffectsPanel />
        </div>
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
