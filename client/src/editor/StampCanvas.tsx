import React, { useEffect, useRef, useState, useCallback } from "react";
import { useEditorStore } from "./store";
import { renderStampSvg, CANVAS_SIZE } from "./svgUtils";
import { useIsMobile } from "@/hooks/useMobile";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Physical mm → internal SVG units ratio
// A 38mm stamp → widthMm=38, CANVAS_SIZE=250, stamp radius = (38/150)*(250/2)*0.95 ≈ 60 units
// We want the stamp to fill ~75% of the viewport

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

// Grid spacing in internal SVG units (CANVAS_SIZE=250 represents the full canvas)
// 1 mm ≈ 250/150 * (widthMm/widthMm) — we use 5mm minor, 10mm major grid lines
// Since the stamp is centered at 125,125 and radius ≈ (widthMm/150)*(125)*0.95
// we draw grid in SVG-unit space where 1 SVG unit ≈ 0.6mm for a 38mm stamp

function MeasurementGrid({ widthMm, heightMm, size }: { widthMm: number; heightMm: number; size: number }) {
  // Grid step: 5 SVG units = minor, 25 SVG units = major (visually ~1mm and 5mm)
  const minor = 5;
  const major = 25;
  const lines: React.ReactElement[] = [];

  for (let x = 0; x <= size; x += minor) {
    const isMajor = x % major === 0;
    lines.push(
      <line key={`vx${x}`} x1={x} y1={0} x2={x} y2={size}
        stroke={isMajor ? "rgba(100,120,160,0.25)" : "rgba(100,120,160,0.1)"}
        strokeWidth={isMajor ? 0.5 : 0.3} />
    );
  }
  for (let y = 0; y <= size; y += minor) {
    const isMajor = y % major === 0;
    lines.push(
      <line key={`hy${y}`} x1={0} y1={y} x2={size} y2={y}
        stroke={isMajor ? "rgba(100,120,160,0.25)" : "rgba(100,120,160,0.1)"}
        strokeWidth={isMajor ? 0.5 : 0.3} />
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${size} ${size}`}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    >
      {lines}
    </svg>
  );
}

export function StampCanvas() {
  const { getActiveStamp, setSelectedElement } = useEditorStore();
  const stamp = getActiveStamp();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [fitted, setFitted] = useState(false);

  // Calculate fit zoom: stamp should occupy ~75% of the viewport
  const calcFitZoom = useCallback(() => {
    const el = containerRef.current;
    if (!el || !stamp) return 1;
    const { width, height } = el.getBoundingClientRect();
    const vw = width - (isMobile ? 32 : 64);
    const vh = height - (isMobile ? 32 : 64);
    // The stamp SVG is CANVAS_SIZE × CANVAS_SIZE internal units
    // We want it to fill ~75% of the smaller viewport dimension
    const target = Math.min(vw, vh) * 0.75;
    const raw = target / CANVAS_SIZE;
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, raw));
  }, [stamp, isMobile]);

  const fitToWorkspace = useCallback(() => {
    setZoom(calcFitZoom());
  }, [calcFitZoom]);

  // Auto-fit on mount and when stamp shape/size changes
  useEffect(() => {
    if (!fitted && containerRef.current) {
      const z = calcFitZoom();
      if (z > 0) { setZoom(z); setFitted(true); }
    }
  }, [fitted, calcFitZoom]);

  // Re-fit when stamp widthMm/heightMm/shape changes
  const prevDims = useRef({ w: 0, h: 0, shape: "" });
  useEffect(() => {
    if (!stamp) return;
    const { widthMm, heightMm, shape } = stamp;
    if (prevDims.current.w !== widthMm || prevDims.current.h !== heightMm || prevDims.current.shape !== shape) {
      prevDims.current = { w: widthMm, h: heightMm, shape };
      setFitted(false);
    }
  }, [stamp?.widthMm, stamp?.heightMm, stamp?.shape]);

  // Also fit on container resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => { if (!fitted) fitToWorkspace(); });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitted, fitToWorkspace]);

  if (!stamp) return null;

  const svgContent = renderStampSvg(stamp);
  const displayPx = Math.round(CANVAS_SIZE * zoom);
  const displaySvg = svgContent.replace(
    /(<svg[^>]*)\s+width="\d+"\s+height="\d+"/,
    `$1 width="${displayPx}" height="${displayPx}"`
  );

  const sizeLabel = stamp.shape === "rectangular"
    ? `${stamp.widthMm} × ${stamp.heightMm} mm`
    : `${stamp.widthMm} mm`;

  const zoomPct = Math.round(zoom * 100);

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center min-h-0 overflow-auto relative"
      style={{
        background: "radial-gradient(ellipse at center, #dce4f0 0%, #c8d4e8 100%)",
        padding: isMobile ? "16px" : "32px",
      }}
      onClick={() => setSelectedElement(null)}
    >
      {/* Measurement grid — fills entire workspace, editor-only */}
      <MeasurementGrid widthMm={stamp.widthMm} heightMm={stamp.heightMm} size={CANVAS_SIZE} />

      {/* Stamp plate */}
      <div
        className="relative"
        style={{ width: displayPx, height: displayPx, flexShrink: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle shadow to indicate the stamp plate boundary */}
        <div
          className="absolute inset-0"
          style={{
            boxShadow: "0 4px 32px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10)",
            background: "white",
            borderRadius: 2,
          }}
        />
        {/* Stamp SVG */}
        <div
          className="relative"
          style={{ width: displayPx, height: displayPx }}
          dangerouslySetInnerHTML={{ __html: displaySvg }}
        />
      </div>

      {/* Size label — bottom-center of workspace */}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.85)",
          border: "1px solid rgba(100,120,160,0.25)",
          borderRadius: 4,
          padding: "2px 10px",
          fontSize: 11,
          color: "#4a5568",
          fontFamily: "monospace",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        {sizeLabel}
      </div>

      {/* Zoom controls — bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          right: 8,
          display: "flex",
          alignItems: "center",
          gap: 4,
          background: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(100,120,160,0.2)",
          borderRadius: 6,
          padding: "2px 6px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          title="Zoom Out"
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, parseFloat((z - ZOOM_STEP).toFixed(2))))}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center", color: "#4a5568" }}
        >
          <ZoomOut size={14} />
        </button>
        <span
          style={{ fontSize: 11, fontFamily: "monospace", minWidth: 36, textAlign: "center", color: "#4a5568", cursor: "pointer" }}
          title="Reset zoom"
          onClick={() => fitToWorkspace()}
        >
          {zoomPct}%
        </span>
        <button
          title="Zoom In"
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, parseFloat((z + ZOOM_STEP).toFixed(2))))}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center", color: "#4a5568" }}
        >
          <ZoomIn size={14} />
        </button>
        <div style={{ width: 1, height: 16, background: "rgba(100,120,160,0.2)", margin: "0 2px" }} />
        <button
          title="Fit to workspace"
          onClick={() => fitToWorkspace()}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center", color: "#4a5568" }}
        >
          <Maximize2 size={14} />
        </button>
      </div>
    </div>
  );
}
