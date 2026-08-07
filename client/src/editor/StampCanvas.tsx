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
// For 38mm round: maxR = 30.08 SVG units, plate diameter = 60.17 SVG units.
//
// Display model:
//   SVG is rendered with a CROPPED viewBox = plate bounding box.
//   SVG element width  = plateW * scale
//   SVG element height = plateH * scale
//
// EditorStage model:
//   The stamp is fitted inside a bounded EditorStage, not against the full browser viewport.
//   stageW = min(availCentralW, MAX_STAGE_PX)
//   stageH = min(availCentralH, MAX_STAGE_PX)
//   fitScale = min(stageW / plateW, stageH / plateH) * SAFE_FACTOR
//
//   MAX_STAGE_PX = 600  →  38mm stamp at fit ≈ 600 * 0.75 / 60.17 * 60.17 = 450px diameter
//   SAFE_FACTOR  = 0.75 →  stamp fills 75% of stage, 25% margin
//
// Zoom percentage:
//   100% = Fit (the fitScale computed above)
//   Manual zoom is expressed relative to fitScale.
//   displayScale = fitScale * (userZoomPct / 100)
//   This means 100% always means "fit the stamp comfortably in the stage".

const MAX_STAGE_PX = 600;   // EditorStage max dimension (CSS px)
const SAFE_FACTOR  = 0.75;  // stamp fills 75% of stage at 100% zoom
const MIN_ZOOM_PCT = 25;    // minimum user zoom (25% of fit)
const MAX_ZOOM_PCT = 400;   // maximum user zoom (400% of fit)
const ZOOM_STEP    = 25;    // zoom step in % of fit

// ─── Plate bounding box in SVG units ─────────────────────────────────────────
interface PlateBounds {
  vbX: number;
  vbY: number;
  vbW: number;
  vbH: number;
}

function getPlateBounds(stamp: Stamp): PlateBounds {
  const cx = CANVAS_CENTER;
  const cy = CANVAS_CENTER;
  const maxR  = (stamp.widthMm  / 150) * (CANVAS_SIZE / 2) * 0.95;
  const maxRy = (stamp.heightMm / 150) * (CANVAS_SIZE / 2) * 0.95;
  if (stamp.shape === "round" || stamp.shape === "triangular") {
    return { vbX: cx - maxR, vbY: cy - maxR, vbW: maxR * 2, vbH: maxR * 2 };
  }
  // oval and rectangular
  return { vbX: cx - maxR, vbY: cy - maxRy, vbW: maxR * 2, vbH: maxRy * 2 };
}

// ─── Measurement grid (inside EditorStage) ───────────────────────────────────
// Drawn in CANVAS_SIZE coordinate space, fills the stage. Editor-only.
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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${size} ${size}`}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      {lines}
    </svg>
  );
}

// ─── Main StampCanvas component ───────────────────────────────────────────────
export function StampCanvas() {
  const { getActiveStamp, setSelectedElement } = useEditorStore();
  const stamp = getActiveStamp();
  const isMobile = useIsMobile();
  const outerRef = useRef<HTMLDivElement>(null);   // full workspace div

  // userZoomPct: 100 = Fit. Manual zoom is relative to the fit scale.
  const [userZoomPct, setUserZoomPct] = useState(100);
  // fitScale: display pixels per SVG unit at 100% zoom (computed from stage size)
  const [fitScale, setFitScale] = useState(4);
  const [fitted, setFitted] = useState(false);

  /**
   * Compute fitScale from the available workspace and the stamp plate bounds.
   *
   * stageW = min(availW, MAX_STAGE_PX)
   * stageH = min(availH, MAX_STAGE_PX)
   * fitScale = min(stageW / plateW, stageH / plateH) * SAFE_FACTOR
   */
  const calcFitScale = useCallback(() => {
    const el = outerRef.current;
    if (!el || !stamp) return 4;
    const { width, height } = el.getBoundingClientRect();
    const pad = isMobile ? 24 : 48;
    const availW = Math.max(80, width  - pad);
    const availH = Math.max(80, height - pad);
    const stageW = Math.min(availW, MAX_STAGE_PX);
    const stageH = Math.min(availH, MAX_STAGE_PX);
    const { vbW, vbH } = getPlateBounds(stamp);
    const s = Math.min(stageW / vbW, stageH / vbH) * SAFE_FACTOR;
    return Math.max(0.5, parseFloat(s.toFixed(3)));
  }, [stamp, isMobile]);

  const fitToWorkspace = useCallback(() => {
    setFitScale(calcFitScale());
    setUserZoomPct(100);
  }, [calcFitScale]);

  // Auto-fit on first render
  useEffect(() => {
    if (!fitted && outerRef.current) {
      const id = requestAnimationFrame(() => {
        const s = calcFitScale();
        if (s > 0) { setFitScale(s); setFitted(true); }
      });
      return () => cancelAnimationFrame(id);
    }
  }, [fitted, calcFitScale]);

  // Re-fit when stamp shape/dimensions change
  const prevKey = useRef("");
  useEffect(() => {
    if (!stamp) return;
    const key = `${stamp.shape}-${stamp.widthMm}-${stamp.heightMm}`;
    if (prevKey.current !== key) {
      prevKey.current = key;
      setFitted(false);
      setUserZoomPct(100);
    }
  }, [stamp?.shape, stamp?.widthMm, stamp?.heightMm]);

  // Re-fit on container resize
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFitted(false));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!stamp) return null;

  // Actual display scale = fitScale * (userZoomPct / 100)
  const displayScale = fitScale * (userZoomPct / 100);
  const bounds = getPlateBounds(stamp);
  const displayW = Math.round(bounds.vbW * displayScale);
  const displayH = Math.round(bounds.vbH * displayScale);

  // Render SVG with cropped viewBox = plate bounding box
  const svgRaw = renderStampSvg(stamp);
  const displaySvg = svgRaw
    .replace(
      /viewBox="[^"]*"/,
      `viewBox="${bounds.vbX.toFixed(3)} ${bounds.vbY.toFixed(3)} ${bounds.vbW.toFixed(3)} ${bounds.vbH.toFixed(3)}"`
    )
    .replace(
      /(<svg[^>]*)\s+width="\d+(?:\.\d+)?"\s+height="\d+(?:\.\d+)?"/,
      `$1 width="${displayW}" height="${displayH}"`
    );

  const sizeLabel = stamp.shape === "rectangular" || stamp.shape === "oval"
    ? `${stamp.widthMm} × ${stamp.heightMm} mm`
    : `${stamp.widthMm} mm`;

  // Stage size: bounded by MAX_STAGE_PX, fills available space below that
  const stageSize = isMobile ? "100%" : `min(${MAX_STAGE_PX}px, 100%)`;

  return (
    <div
      ref={outerRef}
      className="flex-1 flex items-center justify-center min-h-0 overflow-hidden relative"
      style={{
        background: "#c8d4e4",
        padding: isMobile ? "12px" : "24px",
      }}
      onClick={() => setSelectedElement(null)}
    >
      {/* EditorStage — bounded box containing grid + stamp */}
      <div
        style={{
          position: "relative",
          width: stageSize,
          height: stageSize,
          maxWidth: MAX_STAGE_PX,
          maxHeight: MAX_STAGE_PX,
          borderRadius: 6,
          background: "radial-gradient(ellipse at 50% 40%, #dce8f8 0%, #c4d4ec 60%, #b0c4e0 100%)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(80,110,160,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Measurement grid — fills EditorStage, editor-only */}
        <MeasurementGrid />

        {/* Stamp plate — SVG with cropped viewBox, centered in stage */}
        <div
          style={{
            position: "relative",
            width: displayW,
            height: displayH,
            flexShrink: 0,
            filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.22)) drop-shadow(0 1px 4px rgba(0,0,0,0.12))",
          }}
          dangerouslySetInnerHTML={{ __html: displaySvg }}
        />

        {/* Physical size label — bottom-center of stage */}
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255,255,255,0.80)",
            border: "1px solid rgba(80,110,160,0.18)",
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

        {/* Zoom controls — bottom-right of stage */}
        <div
          style={{
            position: "absolute",
            bottom: 8,
            right: 8,
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
            onClick={() => setUserZoomPct((z) => Math.max(MIN_ZOOM_PCT, z - ZOOM_STEP))}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 3px", display: "flex", alignItems: "center", color: "#3d5070" }}
          >
            <ZoomOut size={13} />
          </button>
          <span
            style={{ fontSize: 11, fontFamily: "monospace", minWidth: 38, textAlign: "center", color: "#3d5070", cursor: "pointer", userSelect: "none" }}
            title="Fit stamp to stage (100%)"
            onClick={() => fitToWorkspace()}
          >
            {userZoomPct}%
          </span>
          <button
            title="Zoom In"
            onClick={() => setUserZoomPct((z) => Math.min(MAX_ZOOM_PCT, z + ZOOM_STEP))}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 3px", display: "flex", alignItems: "center", color: "#3d5070" }}
          >
            <ZoomIn size={13} />
          </button>
          <div style={{ width: 1, height: 14, background: "rgba(80,110,160,0.2)", margin: "0 2px" }} />
          <button
            title="Fit stamp to stage (100%)"
            onClick={() => fitToWorkspace()}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 3px", display: "flex", alignItems: "center", color: "#3d5070" }}
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
