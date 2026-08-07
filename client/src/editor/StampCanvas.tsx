import React, { useEffect, useRef, useState, useCallback } from "react";
import { useEditorStore } from "./store";
import { renderStampSvg, CANVAS_SIZE, CANVAS_CENTER } from "./svgUtils";
import { useIsMobile } from "@/hooks/useMobile";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import type { Stamp } from "./types";

// ─── Canonical unit conversion ────────────────────────────────────────────────
//
// Internal SVG coordinate system: CANVAS_SIZE = 250 units, stamp centered at (125, 125).
// Stamp plate radius in SVG units: maxR = (widthMm / 150) * (CANVAS_SIZE / 2) * 0.95
//
// For a 38mm round stamp:
//   maxR = (38 / 150) * 125 * 0.95 = 30.08 SVG units
//   plate diameter = 60.17 SVG units  (only 24% of CANVAS_SIZE=250)
//
// Display model:
//   We render the SVG with a CROPPED viewBox = plate bounding box (not full 0 0 250 250).
//   SVG element width  = plateW * scale  (display pixels)
//   SVG element height = plateH * scale  (display pixels)
//   scale = SAFE_FACTOR * min(availW, availH) / max(plateW, plateH)
//   SAFE_FACTOR = 0.82  →  plate fills ~82% of the smaller viewport dimension
//
// This guarantees:
//   - displayW <= availW * 0.82  (no horizontal overflow)
//   - displayH <= availH * 0.82  (no vertical overflow)
//   - plate is always fully visible with ~18% margin
//
// The zoom% shown to the user is: scale * (plateW / CANVAS_SIZE) * 100
// This represents "how much of the full 250-unit canvas is shown at 100%".
// For user-facing zoom we use scale directly as a multiplier on the plate display size.

// SAFE_FACTOR = 0.72: stamp plate fills ~72% of the smaller viewport dimension.
// This leaves ~14% margin on each side — comfortable for editing without feeling cramped.
// Hard safety conditions (maxByW/maxByH) further guarantee no overflow.
const SAFE_FACTOR = 0.72;
const MIN_SCALE = 0.5;   // minimum plate display px = 0.5 * plate SVG units
const MAX_SCALE = 20;    // maximum plate display px = 20 * plate SVG units
const SCALE_STEP = 0.25; // zoom step in scale units

// ─── Plate bounding box in SVG units ─────────────────────────────────────────
interface PlateBounds {
  vbX: number;   // viewBox x (left edge of plate)
  vbY: number;   // viewBox y (top edge of plate)
  vbW: number;   // viewBox width  (plate width in SVG units)
  vbH: number;   // viewBox height (plate height in SVG units)
}

function getPlateBounds(stamp: Stamp): PlateBounds {
  const cx = CANVAS_CENTER;
  const cy = CANVAS_CENTER;
  const maxR = (stamp.widthMm / 150) * (CANVAS_SIZE / 2) * 0.95;
  const maxRy = (stamp.heightMm / 150) * (CANVAS_SIZE / 2) * 0.95;

  if (stamp.shape === "round" || stamp.shape === "triangular") {
    return { vbX: cx - maxR, vbY: cy - maxR, vbW: maxR * 2, vbH: maxR * 2 };
  }
  if (stamp.shape === "oval") {
    return { vbX: cx - maxR, vbY: cy - maxRy, vbW: maxR * 2, vbH: maxRy * 2 };
  }
  if (stamp.shape === "rectangular") {
    return { vbX: cx - maxR, vbY: cy - maxRy, vbW: maxR * 2, vbH: maxRy * 2 };
  }
  return { vbX: cx - maxR, vbY: cy - maxR, vbW: maxR * 2, vbH: maxR * 2 };
}

// ─── Measurement grid (workspace background) ─────────────────────────────────
// Grid is drawn in CANVAS_SIZE coordinate space and covers the full workspace.
// It is editor-only and never included in exports.
function MeasurementGrid() {
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

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${size} ${size}`}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      {lines}
    </svg>
  );
}

// ─── Main StampCanvas component ───────────────────────────────────────────────
export function StampCanvas() {
  const { getActiveStamp, setSelectedElement } = useEditorStore();
  const stamp = getActiveStamp();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);

  // `scale` = display pixels per SVG unit within the plate viewBox.
  // plate display width  = bounds.vbW * scale
  // plate display height = bounds.vbH * scale
  const [scale, setScale] = useState(4);
  const [fitted, setFitted] = useState(false);

  /**
   * Calculate the scale that makes the stamp plate fill SAFE_FACTOR of the viewport.
   *
   * scale = SAFE_FACTOR * min(availW, availH) / max(plateW, plateH)
   *
   * Hard safety: also ensure displayW <= availW * 0.9 and displayH <= availH * 0.9.
   */
  const calcFitScale = useCallback(() => {
    const el = containerRef.current;
    if (!el || !stamp) return 4;
    const { width, height } = el.getBoundingClientRect();
    const pad = isMobile ? 32 : 64;
    const availW = Math.max(80, width - pad);
    const availH = Math.max(80, height - pad);
    const { vbW, vbH } = getPlateBounds(stamp);
    const plateMax = Math.max(vbW, vbH);

    // Primary: fit to SAFE_FACTOR of the smaller dimension
    let s = (SAFE_FACTOR * Math.min(availW, availH)) / plateMax;

    // Hard safety: clamp so neither dimension overflows 90% of available space
    const maxByW = (availW * 0.9) / vbW;
    const maxByH = (availH * 0.9) / vbH;
    s = Math.min(s, maxByW, maxByH);

    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, parseFloat(s.toFixed(3))));
  }, [stamp, isMobile]);

  const fitToWorkspace = useCallback(() => {
    setScale(calcFitScale());
  }, [calcFitScale]);

  // Auto-fit on first render (rAF ensures layout is complete)
  useEffect(() => {
    if (!fitted && containerRef.current) {
      const id = requestAnimationFrame(() => {
        const s = calcFitScale();
        if (s > 0) { setScale(s); setFitted(true); }
      });
      return () => cancelAnimationFrame(id);
    }
  }, [fitted, calcFitScale]);

  // Re-fit when stamp shape or dimensions change
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

  const bounds = getPlateBounds(stamp);
  const displayW = Math.round(bounds.vbW * scale);
  const displayH = Math.round(bounds.vbH * scale);

  // Render the stamp SVG with a cropped viewBox = plate bounding box.
  // This ensures the SVG element is exactly plate-sized (no surrounding canvas whitespace).
  // All elements (frame, text-on-path, center-text, image) are in the same coordinate
  // system — zoom scales the SVG uniformly via width/height + viewBox.
  const svgRaw = renderStampSvg(stamp);
  const displaySvg = svgRaw
    // Replace viewBox with cropped plate bounds
    .replace(
      /viewBox="[^"]*"/,
      `viewBox="${bounds.vbX.toFixed(3)} ${bounds.vbY.toFixed(3)} ${bounds.vbW.toFixed(3)} ${bounds.vbH.toFixed(3)}"`
    )
    // Replace width/height with display pixel dimensions
    .replace(
      /(<svg[^>]*)\s+width="\d+(?:\.\d+)?"\s+height="\d+(?:\.\d+)?"/,
      `$1 width="${displayW}" height="${displayH}"`
    );

  // Zoom% shown to user: how much the plate is scaled relative to its SVG-unit size.
  // 100% = 1 display pixel per SVG unit (plate would be ~60px for 38mm stamp — very small).
  // We show it as a percentage of the "natural" scale where 1 SVG unit = 1px.
  const zoomPct = Math.round(scale * 100);

  const sizeLabel = stamp.shape === "rectangular" || stamp.shape === "oval"
    ? `${stamp.widthMm} × ${stamp.heightMm} mm`
    : `${stamp.widthMm} mm`;

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
      {/* Measurement grid — covers entire workspace, editor-only */}
      <MeasurementGrid />

      {/* Stamp plate — the SVG IS the editing surface.
          viewBox is cropped to plate bounds so the element is exactly plate-sized.
          Drop-shadow applied to the stamp shape via CSS filter. */}
      <div
        style={{
          position: "relative",
          width: displayW,
          height: displayH,
          flexShrink: 0,
          filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.25)) drop-shadow(0 1px 5px rgba(0,0,0,0.14))",
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
          onClick={() => setScale((s) => Math.max(MIN_SCALE, parseFloat((s - SCALE_STEP).toFixed(3))))}
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
          onClick={() => setScale((s) => Math.min(MAX_SCALE, parseFloat((s + SCALE_STEP).toFixed(3))))}
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
