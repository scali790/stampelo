import React, { useEffect, useRef, useState, useCallback } from "react";
import { useEditorStore } from "./store";
import { renderStampSvg, CANVAS_SIZE, CANVAS_CENTER } from "./svgUtils";
import { useIsMobile } from "@/hooks/useMobile";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import type { Stamp } from "./types";

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 8;
const ZOOM_STEP = 0.25;

/**
 * Returns the actual stamp plate dimensions in SVG units (CANVAS_SIZE=250 coordinate space).
 * This is the bounding box of the stamp shape itself — NOT the full 250×250 canvas.
 */
function getStampPlateSvgSize(stamp: Stamp): { w: number; h: number } {
  const maxR = (stamp.widthMm / 150) * (CANVAS_SIZE / 2) * 0.95;
  if (stamp.shape === "round") {
    return { w: maxR * 2, h: maxR * 2 };
  }
  if (stamp.shape === "oval") {
    const ry = (stamp.heightMm / 150) * (CANVAS_SIZE / 2) * 0.95;
    return { w: maxR * 2, h: ry * 2 };
  }
  if (stamp.shape === "rectangular") {
    const ry = (stamp.heightMm / 150) * (CANVAS_SIZE / 2) * 0.95;
    return { w: maxR * 2, h: ry * 2 };
  }
  if (stamp.shape === "triangular") {
    // Equilateral triangle inscribed in circle of radius maxR
    return { w: maxR * 2, h: maxR * 2 };
  }
  return { w: maxR * 2, h: maxR * 2 };
}

/**
 * Measurement grid rendered as an SVG overlay covering the entire workspace.
 * Grid is in CANVAS_SIZE coordinate space scaled by zoom.
 * Editor-only — never included in exports.
 */
function MeasurementGrid({ zoom }: { zoom: number }) {
  const size = CANVAS_SIZE;
  const minor = 5;
  const major = 25;
  const lines: React.ReactElement[] = [];

  for (let x = 0; x <= size; x += minor) {
    const isMajor = x % major === 0;
    lines.push(
      <line key={`v${x}`} x1={x} y1={0} x2={x} y2={size}
        stroke={isMajor ? "rgba(80,110,160,0.22)" : "rgba(80,110,160,0.09)"}
        strokeWidth={isMajor ? 0.6 : 0.35} />
    );
  }
  for (let y = 0; y <= size; y += minor) {
    const isMajor = y % major === 0;
    lines.push(
      <line key={`h${y}`} x1={0} y1={y} x2={size} y2={y}
        stroke={isMajor ? "rgba(80,110,160,0.22)" : "rgba(80,110,160,0.09)"}
        strokeWidth={isMajor ? 0.6 : 0.35} />
    );
  }

  const px = Math.round(CANVAS_SIZE * zoom);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${size} ${size}`}
      width={px}
      height={px}
      style={{ position: "absolute", pointerEvents: "none", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
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

  /**
   * Calculate the zoom level that makes the stamp plate fill ~75% of the viewport.
   *
   * Key insight: the stamp plate is NOT CANVAS_SIZE wide.
   * For a 38mm round stamp: plate diameter = (38/150) * 250 * 0.95 * 2 ≈ 120 SVG units.
   * We want 120 * zoom ≈ 0.75 * min(vw, vh).
   * So zoom = 0.75 * min(vw, vh) / plateSvgSize.
   */
  const calcFitZoom = useCallback(() => {
    const el = containerRef.current;
    if (!el || !stamp) return 1;
    const { width, height } = el.getBoundingClientRect();
    const pad = isMobile ? 40 : 80;
    const vw = Math.max(100, width - pad);
    const vh = Math.max(100, height - pad);
    const { w: plateW, h: plateH } = getStampPlateSvgSize(stamp);
    // Fit the plate to 75% of the smaller viewport dimension
    const targetPx = Math.min(vw, vh) * 0.75;
    const plateMaxSvg = Math.max(plateW, plateH);
    const raw = targetPx / plateMaxSvg;
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, parseFloat(raw.toFixed(3))));
  }, [stamp, isMobile]);

  const fitToWorkspace = useCallback(() => {
    setZoom(calcFitZoom());
  }, [calcFitZoom]);

  // Auto-fit on first render
  useEffect(() => {
    if (!fitted && containerRef.current) {
      // Use rAF to ensure layout is complete
      const id = requestAnimationFrame(() => {
        const z = calcFitZoom();
        if (z > 0) { setZoom(z); setFitted(true); }
      });
      return () => cancelAnimationFrame(id);
    }
  }, [fitted, calcFitZoom]);

  // Re-fit when stamp dimensions or shape change
  const prevKey = useRef("");
  useEffect(() => {
    if (!stamp) return;
    const key = `${stamp.shape}-${stamp.widthMm}-${stamp.heightMm}`;
    if (prevKey.current !== key) {
      prevKey.current = key;
      setFitted(false);
    }
  }, [stamp?.shape, stamp?.widthMm, stamp?.heightMm]);

  // Re-fit on container resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFitted(false));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!stamp) return null;

  // The stamp SVG is always CANVAS_SIZE × CANVAS_SIZE with the plate centered at (125,125).
  // We scale the entire SVG by `zoom`. The plate plate itself will then appear at the correct size.
  const displayPx = Math.round(CANVAS_SIZE * zoom);
  const svgRaw = renderStampSvg(stamp);
  // Replace the SVG's width/height attributes to match display size while preserving viewBox
  const displaySvg = svgRaw.replace(
    /(<svg[^>]*)\s+width="\d+(?:\.\d+)?"\s+height="\d+(?:\.\d+)?"/,
    `$1 width="${displayPx}" height="${displayPx}"`
  );

  const sizeLabel = stamp.shape === "rectangular" || stamp.shape === "oval"
    ? `${stamp.widthMm} × ${stamp.heightMm} mm`
    : `${stamp.widthMm} mm`;

  const zoomPct = Math.round(zoom * 100);

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center min-h-0 overflow-auto relative select-none"
      style={{
        background: "radial-gradient(ellipse at 50% 40%, #d8e4f4 0%, #bccde6 60%, #a8bcd8 100%)",
        cursor: "default",
      }}
      onClick={() => setSelectedElement(null)}
    >
      {/* Measurement grid — centered on the stamp, editor-only */}
      <MeasurementGrid zoom={zoom} />

      {/* Stamp plate — the SVG itself IS the editing surface, no white box */}
      <div
        style={{
          position: "relative",
          width: displayPx,
          height: displayPx,
          flexShrink: 0,
          // Subtle drop shadow on the stamp itself (not a white box)
          filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.22)) drop-shadow(0 1px 4px rgba(0,0,0,0.12))",
        }}
        onClick={(e) => e.stopPropagation()}
        dangerouslySetInnerHTML={{ __html: displaySvg }}
      />

      {/* Physical size label — bottom-center */}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.82)",
          border: "1px solid rgba(80,110,160,0.2)",
          borderRadius: 4,
          padding: "2px 10px",
          fontSize: 11,
          color: "#3d5070",
          fontFamily: "monospace",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          backdropFilter: "blur(4px)",
        }}
      >
        {sizeLabel}
      </div>

      {/* Zoom controls — bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          right: 10,
          display: "flex",
          alignItems: "center",
          gap: 2,
          background: "rgba(255,255,255,0.88)",
          border: "1px solid rgba(80,110,160,0.18)",
          borderRadius: 6,
          padding: "3px 6px",
          backdropFilter: "blur(4px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          title="Zoom Out"
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, parseFloat((z - ZOOM_STEP).toFixed(3))))}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 3px", display: "flex", alignItems: "center", color: "#3d5070" }}
        >
          <ZoomOut size={13} />
        </button>
        <span
          style={{ fontSize: 11, fontFamily: "monospace", minWidth: 38, textAlign: "center", color: "#3d5070", cursor: "pointer", userSelect: "none" }}
          title="Fit stamp to workspace"
          onClick={() => fitToWorkspace()}
        >
          {zoomPct}%
        </span>
        <button
          title="Zoom In"
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, parseFloat((z + ZOOM_STEP).toFixed(3))))}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 3px", display: "flex", alignItems: "center", color: "#3d5070" }}
        >
          <ZoomIn size={13} />
        </button>
        <div style={{ width: 1, height: 14, background: "rgba(80,110,160,0.2)", margin: "0 2px" }} />
        <button
          title="Fit stamp to workspace"
          onClick={() => fitToWorkspace()}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 3px", display: "flex", alignItems: "center", color: "#3d5070" }}
        >
          <Maximize2 size={13} />
        </button>
      </div>
    </div>
  );
}
