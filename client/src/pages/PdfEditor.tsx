import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, Download, ChevronLeft, ChevronRight, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useEditorStore } from "@/editor/store";
import { renderStampSvg } from "@/editor/svgUtils";
import { trpc } from "@/lib/trpc";

interface StampPlacement {
  x: number; // percentage of page width
  y: number; // percentage of page height
  scale: number; // 0.1 to 3.0
  rotation: number; // 0-360 degrees
  pageIndex: number;
}

export default function PdfEditor() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageCanvas, setPageCanvas] = useState<string | null>(null);
  const [placement, setPlacement] = useState<StampPlacement>({
    x: 50, y: 50, scale: 1, rotation: 0, pageIndex: 0,
  });
  const [pdfKey, setPdfKey] = useState<string | null>(null);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [isStamping, setIsStamping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const stamp = useEditorStore((s) => s.stamps.find((st) => st.id === s.activeStampId));

  const uploadPdf = trpc.pdfEditor.uploadPdf.useMutation({
    onSuccess: (data) => { setPdfKey(data.key); toast.success("PDF uploaded to server"); },
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

  const renderPage = useCallback(async () => {
    if (!pdfDoc) return;
    try {
      const page = await pdfDoc.getPage(currentPage + 1);
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
  }, [pdfDoc, currentPage]);

  useEffect(() => { renderPage(); }, [renderPage]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".pdf")) { toast.error("Please upload a PDF file"); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error("File must be smaller than 20 MB"); return; }
    setPdfFile(file);
    loadPdf(file);
    // Upload to server for server-side merge
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1] ?? "";
      uploadPdf.mutate({ pdfBase64: base64, filename: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
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

  const stampSvg = stamp ? renderStampSvg(stamp) : null;
  const stampSize = stamp ? Math.round((stamp.widthMm / 150) * 200 * placement.scale) : 80;

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
                    disabled={!pdfKey || !stamp || isStamping || stampPdfMutation.isPending}
                    onClick={() => {
                      if (!pdfKey || !stamp) return;
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
                  {!stamp && <p className="text-xs text-amber-600">No stamp loaded. Go back to the editor and design a stamp first.</p>}
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
              {/* Page navigation */}
              <div className="flex items-center gap-3 mb-4">
                <Button size="sm" variant="outline" disabled={currentPage === 0}
                  onClick={() => setCurrentPage((p) => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">Page {currentPage + 1} of {totalPages}</span>
                <Button size="sm" variant="outline" disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage((p) => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Page canvas with stamp overlay */}
              <div
                ref={containerRef}
                className="relative shadow-2xl cursor-crosshair select-none"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {pageCanvas && (
                  <img src={pageCanvas} alt="PDF page" className="max-w-full" draggable={false} />
                )}
                {stampSvg && (
                  <div
                    className="absolute cursor-move"
                    style={{
                      left: `${placement.x}%`,
                      top: `${placement.y}%`,
                      transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
                      width: stampSize,
                      height: stampSize,
                      opacity: 0.85,
                    }}
                    onMouseDown={handleMouseDown}
                    dangerouslySetInnerHTML={{ __html: stampSvg.replace('width="250" height="250"', `width="${stampSize}" height="${stampSize}"`) }}
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
