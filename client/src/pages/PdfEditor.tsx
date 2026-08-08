import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, Download, ChevronLeft, ChevronRight, Pencil, RotateCw } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useEditorStore } from "@/editor/store";
import { renderStampSvg, CANVAS_SIZE, CANVAS_CENTER } from "@/editor/svgUtils";
import { trpc } from "@/lib/trpc";
import type { Stamp } from "@/editor/types";

// ─── Plate bounds (same logic as StampCanvas) ─────────────────────────────────
function getPlateBounds(stamp: Stamp) {
  const maxR  = (stamp.widthMm  / 150) * (CANVAS_SIZE / 2) * 0.95;
  const maxRy = (stamp.heightMm / 150) * (CANVAS_SIZE / 2) * 0.95;
  if (stamp.shape === "round" || stamp.shape === "triangular") {
    return { vbX: CANVAS_CENTER - maxR, vbY: CANVAS_CENTER - maxR, vbW: maxR * 2, vbH: maxR * 2 };
  }
  return { vbX: CANVAS_CENTER - maxR, vbY: CANVAS_CENTER - maxRy, vbW: maxR * 2, vbH: maxRy * 2 };
}

function resizeStampSvg(stamp: Stamp, sizePx: number): string {
  const raw = renderStampSvg(stamp);
  const b = getPlateBounds(stamp);
  return raw
    .replace(/viewBox="[^"]*"/, `viewBox="${b.vbX} ${b.vbY} ${b.vbW} ${b.vbH}"`)
    .replace(/(<svg[^>]*)\s+width="\d+(?:\.\d+)?"\s+height="\d+(?:\.\d+)?"/, `$1 width="${sizePx}" height="${sizePx}"`);
}

interface StampPlacement {
  x: number;      // % of page width
  y: number;      // % of page height
  scale: number;  // 0.1 to 5
  rotation: number; // 0-360 deg
}

type DragMode = "move" | "resize-nw" | "resize-ne" | "resize-se" | "resize-sw"
              | "resize-n" | "resize-s" | "resize-e" | "resize-w" | "rotate" | null;

// Handle definitions: position relative to stamp center (in stamp-local coords)
const HANDLES: { id: DragMode; cx: number; cy: number; cursor: string }[] = [
  { id: "resize-nw", cx: -1, cy: -1, cursor: "nw-resize" },
  { id: "resize-n",  cx:  0, cy: -1, cursor: "n-resize"  },
  { id: "resize-ne", cx:  1, cy: -1, cursor: "ne-resize"  },
  { id: "resize-e",  cx:  1, cy:  0, cursor: "e-resize"   },
  { id: "resize-se", cx:  1, cy:  1, cursor: "se-resize"  },
  { id: "resize-s",  cx:  0, cy:  1, cursor: "s-resize"   },
  { id: "resize-sw", cx: -1, cy:  1, cursor: "sw-resize"  },
  { id: "resize-w",  cx: -1, cy:  0, cursor: "w-resize"   },
];

export default function PdfEditor() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageCanvas, setPageCanvas] = useState<string | null>(null);
  const [placement, setPlacement] = useState<StampPlacement>({ x: 50, y: 50, scale: 1, rotation: 0 });
  const [pdfKey, setPdfKey] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [isStamping, setIsStamping] = useState(false);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, scale: 1, rotation: 0, stampX: 0, stampY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const stamp = useEditorStore((s) => s.stamps.find((st) => st.id === s.activeStampId));

  const uploadPdf = trpc.pdfEditor.uploadPdf.useMutation({
    onSuccess: (data: any) => { setPdfKey(data.key); setPdfBlobUrl(data.url ?? null); toast.success("PDF uploaded successfully"); },
    onError: () => toast.error("Failed to upload PDF"),
  });

  const stampPdfMutation = trpc.pdfEditor.stampPdf.useMutation({
    onSuccess: (data) => {
      setIsStamping(false);
      window.open(data.downloadUrl, "_blank");
      toast.success("Stamped PDF ready — downloading...");
    },
    onError: () => { setIsStamping(false); toast.error("Failed to generate stamped PDF"); },
  });

  const renderPage = useCallback(async (doc: any, pageIdx: number) => {
    if (!doc) return;
    try {
      const pdfjsLib = await import("pdfjs-dist");
      const page = await doc.getPage(pageIdx + 1);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      setPageCanvas(canvas.toDataURL());
    } catch (err) {
      console.error("Failed to render page:", err);
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".pdf")) { toast.error("Please upload a PDF file"); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error("File must be smaller than 20 MB"); return; }
    setPdfFile(file);
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      const arrayBuffer = await file.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setCurrentPage(0);
      renderPage(doc, 0);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1] ?? "";
        uploadPdf.mutate({ pdfBase64: base64, filename: file.name });
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Failed to load PDF. Please try a different file.");
    }
  };

  const goToPage = (idx: number) => {
    setCurrentPage(idx);
    renderPage(pdfDoc, idx);
  };

  // ─── Unified pointer event handlers ─────────────────────────────────────────
  const startDrag = useCallback((mode: DragMode, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragMode(mode);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      scale: placement.scale,
      rotation: placement.rotation,
      stampX: placement.x,
      stampY: placement.y,
    });
  }, [placement]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragMode || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    if (dragMode === "move") {
      const dxPct = (dx / rect.width) * 100;
      const dyPct = (dy / rect.height) * 100;
      setPlacement((p) => ({
        ...p,
        x: Math.max(0, Math.min(100, dragStart.stampX + dxPct)),
        y: Math.max(0, Math.min(100, dragStart.stampY + dyPct)),
      }));
      return;
    }

    if (dragMode === "rotate") {
      // Compute angle from stamp center to current mouse position
      const stampCx = rect.left + (dragStart.stampX / 100) * rect.width;
      const stampCy = rect.top + (dragStart.stampY / 100) * rect.height;
      const angle = Math.atan2(e.clientY - stampCy, e.clientX - stampCx) * (180 / Math.PI) + 90;
      setPlacement((p) => ({ ...p, rotation: ((angle % 360) + 360) % 360 }));
      return;
    }

    // Resize: use the larger of dx/dy to scale uniformly
    if (dragMode.startsWith("resize")) {
      const stampSizePx = dragStart.scale * (stamp?.widthMm ?? 38) / 150 * 200;
      // Determine which axis drives the resize based on handle direction
      let delta = 0;
      if (dragMode === "resize-se" || dragMode === "resize-e" || dragMode === "resize-s") delta = Math.max(dx, dy);
      else if (dragMode === "resize-nw" || dragMode === "resize-w" || dragMode === "resize-n") delta = -Math.min(dx, dy);
      else if (dragMode === "resize-ne") delta = Math.max(-dy, dx);
      else if (dragMode === "resize-sw") delta = Math.max(dy, -dx);
      const newSizePx = Math.max(30, stampSizePx + delta * 1.5);
      const newScale = (newSizePx / ((stamp?.widthMm ?? 38) / 150 * 200));
      setPlacement((p) => ({ ...p, scale: Math.max(0.1, Math.min(5, newScale)) }));
    }
  }, [dragMode, dragStart, stamp]);

  const handleMouseUp = useCallback(() => setDragMode(null), []);

  // Stamp display size
  const stampDisplayPx = stamp ? Math.round((stamp.widthMm / 150) * 200 * placement.scale) : 80;
  const stampSvgStr = stamp ? resizeStampSvg(stamp, stampDisplayPx) : null;

  // ─── No-stamp gate ───────────────────────────────────────────────────────────
  if (!stamp) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="flex items-center gap-3 px-4 py-2 border-b">
          <Link href="/editor">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Editor
            </Button>
          </Link>
          <span className="text-sm font-semibold">PDF Stamp Editor</span>
        </header>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Pencil className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Design your stamp first</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              To use the PDF Stamp Editor you need to create a stamp design first.
              Head to the Stamp Editor, design your stamp, then come back here to apply it to any PDF.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/editor">
                <Button className="gap-2 w-full sm:w-auto">
                  <Pencil className="w-4 h-4" /> Create a Stamp
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full sm:w-auto">Browse Templates</Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              Already have an account?{" "}
              <a href="/account" className="underline hover:text-foreground">Sign in</a>{" "}
              to access your saved stamps.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const HANDLE_SIZE = 10; // px
  const ROTATION_OFFSET = 28; // px below stamp

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center gap-3 px-4 py-2 border-b">
        <Link href="/editor">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Editor
          </Button>
        </Link>
        <span className="text-sm font-semibold">PDF Stamp Editor</span>
        {stamp && <span className="text-xs text-muted-foreground ml-2">Stamp: {stamp.widthMm}mm {stamp.shape}</span>}
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Left: Controls */}
        <div className="w-72 border-r p-4 space-y-4 overflow-y-auto">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Upload PDF</CardTitle></CardHeader>
            <CardContent>
              <label className="flex flex-col items-center gap-2 border-2 border-dashed rounded-lg p-4 cursor-pointer hover:bg-accent/30 transition-colors">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground text-center">
                  {pdfFile ? pdfFile.name : "Click to upload PDF (max 20 MB)"}
                </span>
                <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
              </label>
            </CardContent>
          </Card>

          {pdfDoc && (
            <>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Stamp Position</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Scale: {placement.scale.toFixed(1)}x</Label>
                    <Slider min={0.1} max={5} step={0.05} value={[placement.scale]}
                      onValueChange={([v]) => setPlacement((p) => ({ ...p, scale: v! }))} />
                  </div>
                  <div>
                    <Label className="text-xs flex items-center gap-1"><RotateCw className="w-3 h-3" /> Rotation: {Math.round(placement.rotation)}°</Label>
                    <Slider min={0} max={360} step={1} value={[placement.rotation]}
                      onValueChange={([v]) => setPlacement((p) => ({ ...p, rotation: v! }))} />
                  </div>
                  <p className="text-xs text-muted-foreground">Drag the stamp to move. Use corner handles to resize. Use the rotation handle below the stamp to rotate.</p>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Apply to pages:</label>
                  <div className="flex flex-wrap gap-1">
                    <button
                      className={`text-xs px-2 py-1 rounded border ${selectedPages.length === 0 ? "bg-primary text-white" : "bg-background"}`}
                      onClick={() => setSelectedPages([])}
                    >All</button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        className={`text-xs px-2 py-1 rounded border ${selectedPages.includes(i) ? "bg-primary text-white" : "bg-background"}`}
                        onClick={() => setSelectedPages((prev) =>
                          prev.includes(i) ? prev.filter((p) => p !== i) : [...prev, i]
                        )}
                      >{i + 1}</button>
                    ))}
                  </div>
                </div>
                <Button
                  className="w-full gap-2"
                  disabled={!pdfKey || isStamping || stampPdfMutation.isPending}
                  onClick={() => {
                    if (!pdfKey) return;
                    setIsStamping(true);
                    stampPdfMutation.mutate({
                      pdfKey,
                      ...(pdfBlobUrl ? { pdfUrl: pdfBlobUrl } : {}),
                      stampSvg: renderStampSvg(stamp),
                      placement: {
                        xPct: placement.x,
                        yPct: placement.y,
                        scale: placement.scale,
                        rotation: placement.rotation,
                        stampWidthMm: stamp.widthMm,
                      },
                      pageIndices: selectedPages,
                    });
                  }}
                >
                  {isStamping ? "Generating..." : <><Download className="w-4 h-4" /> Export Stamped PDF</>}
                </Button>
                {!pdfKey && <p className="text-xs text-muted-foreground">Upload a PDF first to enable export.</p>}
              </div>
            </>
          )}
        </div>

        {/* Right: PDF viewer */}
        <div className="flex-1 flex flex-col items-center bg-muted/30 p-4 overflow-auto">
          {!pdfDoc ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <Upload className="w-12 h-12 mx-auto opacity-30" />
                <p>Upload a PDF to get started</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <Button size="sm" variant="outline" disabled={currentPage === 0}
                  onClick={() => goToPage(currentPage - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">Page {currentPage + 1} of {totalPages}</span>
                <Button size="sm" variant="outline" disabled={currentPage >= totalPages - 1}
                  onClick={() => goToPage(currentPage + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* PDF page + stamp overlay */}
              <div
                ref={containerRef}
                className="relative shadow-2xl select-none"
                style={{ cursor: dragMode === "move" ? "grabbing" : "default" }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {pageCanvas && (
                  <img src={pageCanvas} alt="PDF page" className="max-w-full block" draggable={false} />
                )}

                {/* Stamp + selection UI */}
                {stampSvgStr && (
                  <div
                    className="absolute"
                    style={{
                      left: `${placement.x}%`,
                      top: `${placement.y}%`,
                      transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
                      width: stampDisplayPx,
                      height: stampDisplayPx,
                      // Extra space for handles outside the stamp bounds
                      overflow: "visible",
                    }}
                  >
                    {/* Stamp SVG — drag to move */}
                    <div
                      style={{
                        width: stampDisplayPx,
                        height: stampDisplayPx,
                        opacity: 0.85,
                        cursor: dragMode === "move" ? "grabbing" : "grab",
                        position: "relative",
                      }}
                      onMouseDown={(e) => startDrag("move", e)}
                      dangerouslySetInnerHTML={{ __html: stampSvgStr }}
                    />

                    {/* Selection border */}
                    <div style={{
                      position: "absolute",
                      inset: -6,
                      border: "1.5px dashed #3b82f6",
                      borderRadius: 3,
                      pointerEvents: "none",
                    }} />

                    {/* Resize handles */}
                    {HANDLES.map((h) => (
                      <div
                        key={h.id as string}
                        onMouseDown={(e) => startDrag(h.id, e)}
                        style={{
                          position: "absolute",
                          width: HANDLE_SIZE,
                          height: HANDLE_SIZE,
                          background: "white",
                          border: "1.5px solid #3b82f6",
                          borderRadius: 2,
                          cursor: h.cursor,
                          // Position: cx=-1 → left edge, cx=0 → center, cx=1 → right edge
                          left: h.cx === -1 ? -HANDLE_SIZE / 2 - 6 : h.cx === 0 ? stampDisplayPx / 2 - HANDLE_SIZE / 2 : stampDisplayPx + 6 - HANDLE_SIZE / 2,
                          top:  h.cy === -1 ? -HANDLE_SIZE / 2 - 6 : h.cy === 0 ? stampDisplayPx / 2 - HANDLE_SIZE / 2 : stampDisplayPx + 6 - HANDLE_SIZE / 2,
                          zIndex: 10,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                        }}
                      />
                    ))}

                    {/* Rotation handle — below stamp */}
                    {/* Connector line */}
                    <div style={{
                      position: "absolute",
                      left: stampDisplayPx / 2 - 0.5,
                      top: stampDisplayPx + 6,
                      width: 1,
                      height: ROTATION_OFFSET - 6,
                      background: "#3b82f6",
                      pointerEvents: "none",
                    }} />
                    <div
                      onMouseDown={(e) => startDrag("rotate", e)}
                      title="Drag to rotate"
                      style={{
                        position: "absolute",
                        width: HANDLE_SIZE + 2,
                        height: HANDLE_SIZE + 2,
                        background: "white",
                        border: "1.5px solid #3b82f6",
                        borderRadius: "50%",
                        cursor: "crosshair",
                        left: stampDisplayPx / 2 - (HANDLE_SIZE + 2) / 2,
                        top: stampDisplayPx + ROTATION_OFFSET,
                        zIndex: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                      }}
                    >
                      <RotateCw style={{ width: 7, height: 7, color: "#3b82f6" }} />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
