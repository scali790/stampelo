import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, Download, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useEditorStore } from "@/editor/store";
import { renderStampSvg, CANVAS_SIZE, CANVAS_CENTER } from "@/editor/svgUtils";
import { trpc } from "@/lib/trpc";
import type { Stamp } from "@/editor/types";

// ─── Plate bounds (same logic as StampCanvas) ────────────────────────────────
function getPlateBounds(stamp: Stamp) {
  const maxR  = (stamp.widthMm  / 150) * (CANVAS_SIZE / 2) * 0.95;
  const maxRy = (stamp.heightMm / 150) * (CANVAS_SIZE / 2) * 0.95;
  if (stamp.shape === "round" || stamp.shape === "triangular") {
    return { vbX: CANVAS_CENTER - maxR, vbY: CANVAS_CENTER - maxR, vbW: maxR * 2, vbH: maxR * 2 };
  }
  return { vbX: CANVAS_CENTER - maxR, vbY: CANVAS_CENTER - maxRy, vbW: maxR * 2, vbH: maxRy * 2 };
}

// Resize SVG string to given px dimensions using the cropped plate viewBox
function resizeStampSvg(stamp: Stamp, sizePx: number): string {
  const raw = renderStampSvg(stamp);
  const b = getPlateBounds(stamp);
  return raw
    .replace(/viewBox="[^"]*"/, `viewBox="${b.vbX} ${b.vbY} ${b.vbW} ${b.vbH}"`)
    .replace(/(<svg[^>]*)\s+width="\d+(?:\.\d+)?"\s+height="\d+(?:\.\d+)?"/, `$1 width="${sizePx}" height="${sizePx}"`);
}

interface StampPlacement {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export default function PdfEditor() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageCanvas, setPageCanvas] = useState<string | null>(null);
  const [placement, setPlacement] = useState<StampPlacement>({ x: 50, y: 50, scale: 1, rotation: 0 });
  const [pdfKey, setPdfKey] = useState<string | null>(null);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [isStamping, setIsStamping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Reactive selector — re-renders when store hydrates from localStorage
  const stamp = useEditorStore((s) => s.stamps.find((st) => st.id === s.activeStampId));

  const uploadPdf = trpc.pdfEditor.uploadPdf.useMutation({
    onSuccess: (data) => { setPdfKey(data.key); toast.success("PDF uploaded successfully"); },
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

  const loadPdf = useCallback(async (file: File) => {
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      const arrayBuffer = await file.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setCurrentPage(0);
    } catch (err) {
      toast.error("Failed to load PDF. Please try a different file.");
    }
  }, []);

  const renderPage = useCallback(async (doc: any, pageIdx: number) => {
    if (!doc) return;
    try {
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
    const doc = await (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        const arrayBuffer = await file.arrayBuffer();
        const d = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setPdfDoc(d);
        setTotalPages(d.numPages);
        setCurrentPage(0);
        renderPage(d, 0);
        return d;
      } catch {
        toast.error("Failed to load PDF. Please try a different file.");
        return null;
      }
    })();
    if (!doc) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1] ?? "";
      uploadPdf.mutate({ pdfBase64: base64, filename: file.name });
    };
    reader.readAsDataURL(file);
  };

  const goToPage = (idx: number) => {
    setCurrentPage(idx);
    renderPage(pdfDoc, idx);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.x) / rect.width) * 100;
    const dy = ((e.clientY - dragStart.y) / rect.height) * 100;
    setPlacement((p) => ({
      ...p,
      x: Math.max(0, Math.min(100, p.x + dx)),
      y: Math.max(0, Math.min(100, p.y + dy)),
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart]);

  const handleMouseUp = () => setIsDragging(false);

  // Stamp display size in px on the PDF canvas overlay
  const stampDisplayPx = stamp ? Math.round((stamp.widthMm / 150) * 200 * placement.scale) : 80;
  const stampSvgStr = stamp ? resizeStampSvg(stamp, stampDisplayPx) : null;

  // ── No-stamp gate ──────────────────────────────────────────────────────────
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center gap-3 px-4 py-2 border-b">
        <Link href="/editor">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Editor
          </Button>
        </Link>
        <span className="text-sm font-semibold">PDF Stamp Editor</span>
        <span className="text-xs text-muted-foreground ml-auto">
          Stamp: <span className="font-medium text-foreground">{stamp.widthMm}mm {stamp.shape}</span>
        </span>
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
                    <Slider min={0.1} max={3} step={0.1} value={[placement.scale]}
                      onValueChange={([v]) => setPlacement((p) => ({ ...p, scale: v! }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Rotation: {placement.rotation}°</Label>
                    <Slider min={0} max={360} step={1} value={[placement.rotation]}
                      onValueChange={([v]) => setPlacement((p) => ({ ...p, rotation: v! }))} />
                  </div>
                  <p className="text-xs text-muted-foreground">Drag the stamp on the page to reposition it.</p>
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

              <div
                ref={containerRef}
                className="relative shadow-2xl select-none"
                style={{ cursor: isDragging ? "grabbing" : "default" }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {pageCanvas && (
                  <img src={pageCanvas} alt="PDF page" className="max-w-full block" draggable={false} />
                )}
                {stampSvgStr && (
                  <div
                    className="absolute"
                    style={{
                      left: `${placement.x}%`,
                      top: `${placement.y}%`,
                      transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
                      width: stampDisplayPx,
                      height: stampDisplayPx,
                      opacity: 0.85,
                      cursor: "grab",
                      pointerEvents: "all",
                    }}
                    onMouseDown={handleMouseDown}
                    dangerouslySetInnerHTML={{ __html: stampSvgStr }}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
