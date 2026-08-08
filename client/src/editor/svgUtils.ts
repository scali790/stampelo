import type {
  CenterTextElement,
  FrameElement,
  ImageElement,
  Stamp,
  StampElement,
  TextOnPathElement,
} from "./types";

// Canvas is always 250x250 internal units (matching reference)
export const CANVAS_SIZE = 250;
export const CANVAS_CENTER = CANVAS_SIZE / 2;
const TEXT_PATH_SWEEP_DEGREES = 140;
const INNER_SAFETY_MARGIN = 2.5;
const ARC_ASCENDER_RATIO = 0.28;
const ARC_EXTRA_GAP = 1.5;
const ARC_INNER_BODY_RATIO = 0.16;
const INNER_CONTENT_PADDING = 2.5;
const ARC_RENDER_OUTER_CLEARANCE = 2.5;
const ARIAL_BOLD_CHAR_WIDTH_RATIO = 0.58;
const CENTER_TEXT_WIDTH_FACTOR = 0.86;
const CENTER_TEXT_LINE_HEIGHT = 1.08;
const CENTER_TEXT_VISUAL_WIDTH_OCCUPANCY = 0.84;
const CENTER_TEXT_VISUAL_HEIGHT_OCCUPANCY = 0.78;
export const CENTER_TEXT_EDGE_CLEARANCE = 2.5;

// ─── Shabby filter definition ─────────────────────────────────────────────────
export function getShabbyFilter(id: string): string {
  return `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
  <feTurbulence baseFrequency="0.5" numOctaves="2" result="noise" seed="390" type="fractalNoise"/>
  <feColorMatrix result="noiseMask" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 5 -3.2"/>
  <feComposite in="SourceGraphic" in2="noiseMask" operator="out" result="eroded"/>
  <feTurbulence baseFrequency="0.002" in="eroded" result="warp" type="fractalNoise"/>
  <feGaussianBlur in="eroded" result="blurred" stdDeviation="0.3"/>
  <feComposite in="eroded" in2="blurred" operator="out" result="combined"/>
  <feComposite in2="warp" result="warped"/>
  <feColorMatrix result="final" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 20 -9"/>
  <feComposite in="eroded" in2="final" operator="in"/>
</filter>`;
}

// ─── Gold gradient definition ─────────────────────────────────────────────────
export function getGoldFilter(id: string): string {
  return `<linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" style="stop-color:#b8860b;stop-opacity:1"/>
  <stop offset="25%" style="stop-color:#ffd700;stop-opacity:1"/>
  <stop offset="50%" style="stop-color:#daa520;stop-opacity:1"/>
  <stop offset="75%" style="stop-color:#ffd700;stop-opacity:1"/>
  <stop offset="100%" style="stop-color:#b8860b;stop-opacity:1"/>
</linearGradient>`;
}

// ─── Silver gradient definition ───────────────────────────────────────────────
export function getSilverFilter(id: string): string {
  return `<linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" style="stop-color:#808080;stop-opacity:1"/>
  <stop offset="25%" style="stop-color:#d3d3d3;stop-opacity:1"/>
  <stop offset="50%" style="stop-color:#a9a9a9;stop-opacity:1"/>
  <stop offset="75%" style="stop-color:#d3d3d3;stop-opacity:1"/>
  <stop offset="100%" style="stop-color:#808080;stop-opacity:1"/>
</linearGradient>`;
}

// ─── Clip path for stamp shape ────────────────────────────────────────────────
export function getClipPath(stamp: Stamp, clipId: string): string {
  const { shape, widthMm, heightMm } = stamp;
  const cx = CANVAS_CENTER;
  const cy = CANVAS_CENTER;
  const rx = (widthMm / 150) * (CANVAS_SIZE / 2) * 0.95;
  const ry = shape === "oval" ? (heightMm / 150) * (CANVAS_SIZE / 2) * 0.95 : rx;

  if (shape === "round") {
    return `<clipPath id="${clipId}"><circle cx="${cx}" cy="${cy}" r="${rx}"/></clipPath>`;
  }
  if (shape === "oval") {
    return `<clipPath id="${clipId}"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath>`;
  }
  if (shape === "rectangular") {
    const w = rx * 2;
    const h = ry * 2;
    return `<clipPath id="${clipId}"><rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="4"/></clipPath>`;
  }
  if (shape === "triangular") {
    const r = rx;
    const x1 = cx;
    const y1 = cy - r;
    const x2 = cx + r * Math.cos(Math.PI / 6);
    const y2 = cy + r * Math.sin(Math.PI / 6);
    const x3 = cx - r * Math.cos(Math.PI / 6);
    const y3 = cy + r * Math.sin(Math.PI / 6);
    return `<clipPath id="${clipId}"><polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}"/></clipPath>`;
  }
  return `<clipPath id="${clipId}"><circle cx="${cx}" cy="${cy}" r="${rx}"/></clipPath>`;
}

export interface StampPlateGeometry {
  maxRx: number;
  maxRy: number;
  textPathBaseRadius: number;
}

export interface StampSafeBounds extends StampPlateGeometry {
  safeRx: number;
  safeRy: number;
}

interface FrameAxisBand {
  radiusPct: number;
  strokeWidth: number;
  radiusX: number;
  radiusY: number;
  outerEdgeX: number;
  outerEdgeY: number;
  innerEdgeX: number;
  innerEdgeY: number;
}

export interface StampContentBounds extends StampPlateGeometry {
  contentRx: number;
  contentRy: number;
  source: "outer-safe" | "inner-frame";
}

function getOuterFrame(stamp: Stamp): FrameElement | undefined {
  return stamp.elements
    .filter((el): el is FrameElement => el.type === "frame" && el.visible !== false)
    .sort((a, b) => b.radius - a.radius)[0];
}

export function getStampPlateGeometry(stamp: Stamp): StampPlateGeometry {
  const maxRx = (stamp.widthMm / 150) * (CANVAS_SIZE / 2) * 0.95;
  const maxRy =
    stamp.shape === "round" || stamp.shape === "triangular"
      ? maxRx
      : (stamp.heightMm / 150) * (CANVAS_SIZE / 2) * 0.95;

  return {
    maxRx,
    maxRy,
    textPathBaseRadius: Math.min(maxRx, maxRy),
  };
}

export function getStampSafeBounds(stamp: Stamp): StampSafeBounds {
  const geometry = getStampPlateGeometry(stamp);
  const outerFrame = getOuterFrame(stamp);
  const frameRadiusPct = outerFrame?.radius ?? 95;
  const frameStrokeWidth = outerFrame?.strokeWidth ?? 3;

  if (stamp.shape === "oval") {
    const frameRx = (frameRadiusPct / 100) * geometry.maxRx;
    const frameRy = (frameRadiusPct / 100) * geometry.maxRy;
    return {
      ...geometry,
      safeRx: Math.max(frameRx - frameStrokeWidth / 2 - INNER_SAFETY_MARGIN, 1),
      safeRy: Math.max(frameRy - frameStrokeWidth / 2 - INNER_SAFETY_MARGIN, 1),
    };
  }

  if (stamp.shape === "rectangular") {
    const frameHalfW = (frameRadiusPct / 100) * geometry.maxRx;
    const frameHalfH = (frameRadiusPct / 100) * geometry.maxRy;
    return {
      ...geometry,
      safeRx: Math.max(frameHalfW - frameStrokeWidth / 2 - INNER_SAFETY_MARGIN, 1),
      safeRy: Math.max(frameHalfH - frameStrokeWidth / 2 - INNER_SAFETY_MARGIN, 1),
    };
  }

  if (stamp.shape === "triangular") {
    const frameR = (frameRadiusPct / 100) * geometry.maxRx;
    const safeTriangleR = Math.max(frameR - frameStrokeWidth / 2 - INNER_SAFETY_MARGIN, 1);
    return {
      ...geometry,
      safeRx: safeTriangleR * Math.cos(Math.PI / 6),
      safeRy: safeTriangleR,
    };
  }

  const frameR = (frameRadiusPct / 100) * geometry.maxRx;
  const safeR = Math.max(frameR - frameStrokeWidth / 2 - INNER_SAFETY_MARGIN, 1);
  return {
    ...geometry,
    safeRx: safeR,
    safeRy: safeR,
  };
}

function getVisibleFrameAxisBands(stamp: Stamp): FrameAxisBand[] {
  const geometry = getStampPlateGeometry(stamp);
  return stamp.elements
    .filter((el): el is FrameElement => el.type === "frame" && el.visible !== false)
    .map((frame) => {
      const radiusX =
        stamp.shape === "oval" || stamp.shape === "rectangular"
          ? (frame.radius / 100) * geometry.maxRx
          : (frame.radius / 100) * geometry.maxRx;
      const radiusY =
        stamp.shape === "oval" || stamp.shape === "rectangular"
          ? (frame.radius / 100) * geometry.maxRy
          : (frame.radius / 100) * geometry.maxRx;
      return {
        radiusPct: frame.radius,
        strokeWidth: frame.strokeWidth,
        radiusX,
        radiusY,
        outerEdgeX: radiusX + frame.strokeWidth / 2,
        outerEdgeY: radiusY + frame.strokeWidth / 2,
        innerEdgeX: radiusX - frame.strokeWidth / 2,
        innerEdgeY: radiusY - frame.strokeWidth / 2,
      };
    })
    .sort((a, b) => b.radiusY - a.radiusY);
}

function getNearestInnerFrameOuterEdge(stamp: Stamp): number | null {
  const [, ...innerFrames] = getVisibleFrameAxisBands(stamp);
  if (innerFrames.length === 0) return null;
  return innerFrames[0]!.outerEdgeY;
}

function getOuterFrameInnerEdge(stamp: Stamp): number {
  const [outerFrame] = getVisibleFrameAxisBands(stamp);
  if (outerFrame) return outerFrame.innerEdgeY;
  return getStampSafeBounds(stamp).safeRy + INNER_SAFETY_MARGIN;
}

export function getStampContentBounds(stamp: Stamp): StampContentBounds {
  const geometry = getStampPlateGeometry(stamp);
  const safeBounds = getStampSafeBounds(stamp);
  const [, innerFrame] = getVisibleFrameAxisBands(stamp);

  if (!innerFrame) {
    return {
      ...geometry,
      contentRx: safeBounds.safeRx,
      contentRy: safeBounds.safeRy,
      source: "outer-safe",
    };
  }

  return {
    ...geometry,
    contentRx: Math.max(innerFrame.innerEdgeX - INNER_CONTENT_PADDING, 1),
    contentRy: Math.max(innerFrame.innerEdgeY - INNER_CONTENT_PADDING, 1),
    source: "inner-frame",
  };
}

// ─── Frame element renderer ───────────────────────────────────────────────────
function renderFrame(el: FrameElement, stamp: Stamp): string {
  const cx = CANVAS_CENTER;
  const cy = CANVAS_CENTER;
  const maxR = (stamp.widthMm / 150) * (CANVAS_SIZE / 2) * 0.95;
  const r = (el.radius / 100) * maxR;
  const sw = el.strokeWidth;
  const color = el.color;

  if (el.lineBreak > 0) {
    const circumference = 2 * Math.PI * r;
    const gapAngle = el.lineBreak;
    const gapLength = (gapAngle / 360) * circumference;
    const dashLength = circumference - gapLength;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-dasharray="${dashLength} ${gapLength}" stroke-dashoffset="${gapLength / 2}"/>`;
  }

  if (stamp.shape === "round" || stamp.shape === "oval") {
    if (stamp.shape === "oval") {
      const ry = (stamp.heightMm / 150) * (CANVAS_SIZE / 2) * 0.95;
      const rx2 = (el.radius / 100) * maxR;
      const ry2 = (el.radius / 100) * ry;
      return `<ellipse cx="${cx}" cy="${cy}" rx="${rx2}" ry="${ry2}" fill="none" stroke="${color}" stroke-width="${sw}"/>`;
    }
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}"/>`;
  }
  if (stamp.shape === "rectangular") {
    const maxW = maxR * 2;
    const maxH = (stamp.heightMm / 150) * (CANVAS_SIZE / 2) * 0.95 * 2;
    const w = (el.radius / 100) * maxW;
    const h = (el.radius / 100) * maxH;
    return `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="4" fill="none" stroke="${color}" stroke-width="${sw}"/>`;
  }
  if (stamp.shape === "triangular") {
    const rr = (el.radius / 100) * maxR;
    const x1 = cx, y1 = cy - rr;
    const x2 = cx + rr * Math.cos(Math.PI / 6), y2 = cy + rr * Math.sin(Math.PI / 6);
    const x3 = cx - rr * Math.cos(Math.PI / 6), y3 = cy + rr * Math.sin(Math.PI / 6);
    return `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="none" stroke="${color}" stroke-width="${sw}"/>`;
  }
  return "";
}

// ─── Text on path renderer ────────────────────────────────────────────────────
export interface TextPathGeometry {
  role: "top" | "bottom";
  radius: number;
  rx: number;
  ry: number;
  centerAngleDeg: number;
  startAngleDeg: number;
  endAngleDeg: number;
  sweepFlag: 0 | 1;
  largeArcFlag: 0 | 1;
  pathLength: number;
  pathD: string;
}

function normalizeAngleDeg(angleDeg: number): number {
  return ((angleDeg % 360) + 360) % 360;
}

function clockAngleToRadians(clockAngleDeg: number): number {
  return ((clockAngleDeg - 90) * Math.PI) / 180;
}

function pointOnEllipse(rx: number, ry: number, clockAngleDeg: number): { x: number; y: number } {
  const rad = clockAngleToRadians(clockAngleDeg);
  return {
    x: CANVAS_CENTER + rx * Math.cos(rad),
    y: CANVAS_CENTER + ry * Math.sin(rad),
  };
}

function getArcAngleDelta(startAngleDeg: number, endAngleDeg: number, sweepFlag: 0 | 1): number {
  const clockwiseDelta = (endAngleDeg - startAngleDeg + 360) % 360;
  return sweepFlag === 1 ? clockwiseDelta : clockwiseDelta - 360;
}

function approximateArcLength(
  rx: number,
  ry: number,
  startAngleDeg: number,
  endAngleDeg: number,
  sweepFlag: 0 | 1
): number {
  const delta = getArcAngleDelta(startAngleDeg, endAngleDeg, sweepFlag);
  const steps = 96;
  let length = 0;
  let prev = pointOnEllipse(rx, ry, startAngleDeg);

  for (let idx = 1; idx <= steps; idx++) {
    const angle = startAngleDeg + (delta * idx) / steps;
    const next = pointOnEllipse(rx, ry, angle);
    length += Math.hypot(next.x - prev.x, next.y - prev.y);
    prev = next;
  }

  return length;
}

export function getTextPathGeometry(el: TextOnPathElement, stamp: Stamp): TextPathGeometry {
  const geometry = getStampPlateGeometry(stamp);
  const rx = stamp.shape === "oval"
    ? (el.radius / 100) * geometry.maxRx
    : (el.radius / 100) * geometry.textPathBaseRadius;
  const ry = stamp.shape === "oval"
    ? (el.radius / 100) * geometry.maxRy
    : (el.radius / 100) * geometry.textPathBaseRadius;
  const radius = Math.min(rx, ry);
  const role = el.inverse ? "bottom" : "top";
  const centerAngleDeg = normalizeAngleDeg((el.inverse ? 180 : 0) + el.startAngle);
  const halfSweep = TEXT_PATH_SWEEP_DEGREES / 2;
  const startAngleDeg = normalizeAngleDeg(
    el.inverse ? centerAngleDeg + halfSweep : centerAngleDeg - halfSweep
  );
  const endAngleDeg = normalizeAngleDeg(
    el.inverse ? centerAngleDeg - halfSweep : centerAngleDeg + halfSweep
  );
  const sweepFlag: 0 | 1 = el.inverse ? 0 : 1;
  const largeArcFlag: 0 | 1 = TEXT_PATH_SWEEP_DEGREES > 180 ? 1 : 0;
  const start = pointOnEllipse(rx, ry, startAngleDeg);
  const end = pointOnEllipse(rx, ry, endAngleDeg);
  const pathD = `M ${start.x.toFixed(2)},${start.y.toFixed(2)} A ${rx.toFixed(2)},${ry.toFixed(2)} 0 ${largeArcFlag},${sweepFlag} ${end.x.toFixed(2)},${end.y.toFixed(2)}`;
  const pathLength = approximateArcLength(rx, ry, startAngleDeg, endAngleDeg, sweepFlag);

  return {
    role,
    radius,
    rx,
    ry,
    centerAngleDeg,
    startAngleDeg,
    endAngleDeg,
    sweepFlag,
    largeArcFlag,
    pathLength,
    pathD,
  };
}

// Returns { defs, svg } so defs can be hoisted to top-level <defs>
function renderTextOnPath(el: TextOnPathElement, stamp: Stamp, elIdx: number): { defs: string; svg: string } {
  const pathId = `tp-path-${elIdx}`;
  const geometry = getTextPathGeometry(el, stamp);

  // Auto-fit font size and letter-spacing to the usable portion of the
  // semantic arc. This keeps whitespace near the endpoints without relying on
  // full-circle offsets.
  const fitted = fitArcText(el.text, geometry.pathLength, el.fontSize, el.letterSpacing);
  const fontStyle = `font-family="${el.font}" font-size="${fitted.fontSize}"${el.bold ? ' font-weight="bold"' : ''}${el.italic ? ' font-style="italic"' : ''}`;
  const spacingPx = (fitted.letterSpacing - 100) * 0.08;
  const spacing = spacingPx !== 0 ? ` letter-spacing="${spacingPx.toFixed(2)}"` : "";
  const textLength = getRequiredArcLength(el.text.length, fitted.fontSize, fitted.letterSpacing);
  const availableOffset = Math.max(geometry.pathLength - textLength, 0);
  const offset =
    el.align === "center"
      ? (availableOffset / 2).toFixed(2)
      : el.align === "right"
        ? availableOffset.toFixed(2)
        : "0";

  return {
    defs: `<path id="${pathId}" d="${geometry.pathD}" fill="none"/>`,
    svg: `<text fill="${el.color}" ${fontStyle}${spacing}>
  <textPath href="#${pathId}" startOffset="${offset}">${escapeXml(el.text)}</textPath>
</text>`,
  };
}

// ─── Arc-length auto-fit helper ───────────────────────────────────────────────
// Computes the font size and letter-spacing needed to fit text on a circular arc.
//
// Available arc = pathLength * ARC_USABLE_FRACTION
// Required arc  = numChars * fontSize * CHAR_WIDTH_RATIO + letterSpacingExtra
//
// Strategy:
//   1. Never compress tracking below ARC_MIN_READABLE_LETTER_SPACING.
//   2. Choose the largest font size that can fit while respecting that floor.
//   3. At that font size, keep the widest tracking that still fits.
//   4. If nothing fits, fall back to the readability floor at the minimum font size.
//
// Returns { fontSize, letterSpacing } — both may be reduced from the input values.

export const ARC_VISUAL_SAFE_OCCUPANCY = 0.68;
const ARC_CHAR_WIDTH_RATIO = 0.58;  // Arial Bold average char width / fontSize
export const MIN_FONT_SIZE_ARC = 3; // minimum readable font size on arc
export const ARC_MIN_READABLE_LETTER_SPACING = 94;

export function fitArcText(
  text: string,
  pathLength: number,
  requestedFontSize: number,
  requestedLetterSpacing: number
): { fontSize: number; letterSpacing: number } {
  const numChars = text.length;
  if (numChars === 0) return { fontSize: requestedFontSize, letterSpacing: requestedLetterSpacing };

  const availableArc = pathLength * ARC_VISUAL_SAFE_OCCUPANCY;
  const clampedLetterSpacing = Number.isFinite(requestedLetterSpacing)
    ? Math.max(requestedLetterSpacing, ARC_MIN_READABLE_LETTER_SPACING)
    : 100;
  const clampedFontSize = Number.isFinite(requestedFontSize) ? requestedFontSize : MIN_FONT_SIZE_ARC;
  const maxSpacingThatFits = (fontSize: number): number | null => {
    if (getRequiredArcLength(numChars, fontSize, ARC_MIN_READABLE_LETTER_SPACING) > availableArc) {
      return null;
    }

    let lo = ARC_MIN_READABLE_LETTER_SPACING;
    let hi = clampedLetterSpacing;
    let best = ARC_MIN_READABLE_LETTER_SPACING;

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (getRequiredArcLength(numChars, fontSize, mid) <= availableArc) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    return best;
  };

  for (let fontSize = Math.floor(clampedFontSize); fontSize >= MIN_FONT_SIZE_ARC; fontSize--) {
    const letterSpacing = maxSpacingThatFits(fontSize);
    if (letterSpacing !== null) {
      return { fontSize, letterSpacing };
    }
  }

  return { fontSize: MIN_FONT_SIZE_ARC, letterSpacing: ARC_MIN_READABLE_LETTER_SPACING };
}

export function getRequiredArcLength(numChars: number, fontSize: number, letterSpacing: number): number {
  const spacingPx = (letterSpacing - 100) * 0.08;
  return numChars * fontSize * ARC_CHAR_WIDTH_RATIO + spacingPx * Math.max(numChars - 1, 0);
}

export interface TextOnPathVisualMetrics {
  geometry: TextPathGeometry;
  requiredLength: number;
  occupancy: number;
  outerClearance: number;
  innerClearance: number | null;
  bandWidth: number | null;
  bandOccupancy: number | null;
  centerRegionClearance: number | null;
}

// ─── Center text renderer ─────────────────────────────────────────────────────
export function getCenterTextLines(text: string): string[] {
  return String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function getCenterTextLineYs(centerY: number, fontSize: number, lineCount: number): number[] {
  const lineHeight = fontSize * CENTER_TEXT_LINE_HEIGHT;
  return Array.from({ length: lineCount }, (_, idx) => centerY + (idx - (lineCount - 1) / 2) * lineHeight);
}

function getShapeHalfWidthAtY(stamp: Stamp, safeBounds: StampSafeBounds, y: number): number {
  const dy = y - CANVAS_CENTER;

  if (stamp.shape === "rectangular") {
    return Math.abs(dy) <= safeBounds.safeRy ? safeBounds.safeRx : 0;
  }

  if (stamp.shape === "triangular") {
    const topY = CANVAS_CENTER - safeBounds.safeRy;
    const baseY = CANVAS_CENTER + safeBounds.safeRy * 0.5;
    if (y < topY || y > baseY) return 0;
    const t = (y - topY) / (baseY - topY);
    return safeBounds.safeRx * Math.max(Math.min(t, 1), 0);
  }

  if (Math.abs(dy) >= safeBounds.safeRy) return 0;
  const ellipseFactor = Math.sqrt(Math.max(1 - (dy * dy) / (safeBounds.safeRy * safeBounds.safeRy), 0));
  return safeBounds.safeRx * ellipseFactor;
}

export function doesCenterTextFit(
  el: CenterTextElement,
  stamp: Stamp,
  fontSize = el.fontSize
): boolean {
  const lines = getCenterTextLines(el.text);
  if (lines.length === 0) return true;

  const safeBounds = getStampSafeBounds(stamp);
  const contentBounds = getStampContentBounds(stamp);
  const x = (el.x / 100) * CANVAS_SIZE;
  const y = (el.y / 100) * CANVAS_SIZE;
  const lineYs = getCenterTextLineYs(y, fontSize, lines.length);
  const lineHeight = fontSize * CENTER_TEXT_LINE_HEIGHT;
  const availableHeight = contentBounds.contentRy * 2;
  const blockTop = lineYs[0]! - fontSize * 0.6;
  const blockBottom = lineYs[lineYs.length - 1]! + fontSize * 0.6;
  const blockHeight = blockBottom - blockTop;
  const minTop = CANVAS_CENTER - contentBounds.contentRy;
  const maxBottom = CANVAS_CENTER + contentBounds.contentRy;

  if (blockTop < minTop || blockBottom > maxBottom) {
    return false;
  }

  if (
    stamp.shape !== "rectangular" &&
    (blockTop - minTop < CENTER_TEXT_EDGE_CLEARANCE || maxBottom - blockBottom < CENTER_TEXT_EDGE_CLEARANCE)
  ) {
    return false;
  }

  if (blockHeight > availableHeight * CENTER_TEXT_VISUAL_HEIGHT_OCCUPANCY) {
    return false;
  }

  return lines.every((line, idx) => {
    const width = line.length * fontSize * ARIAL_BOLD_CHAR_WIDTH_RATIO;
    const halfWidth =
      getShapeHalfWidthAtY(
        stamp,
        { ...safeBounds, safeRx: contentBounds.contentRx, safeRy: contentBounds.contentRy },
        lineYs[idx]!
      ) *
      CENTER_TEXT_WIDTH_FACTOR *
      CENTER_TEXT_VISUAL_WIDTH_OCCUPANCY;
    return Math.abs(x - CANVAS_CENTER) + width / 2 <= halfWidth && lineHeight <= contentBounds.contentRy * 2;
  });
}

export interface CenterTextVisualMetrics {
  maxWidthOccupancy: number;
  heightOccupancy: number;
  topClearance: number;
  bottomClearance: number;
}

export function getCenterTextVisualMetrics(
  el: CenterTextElement,
  stamp: Stamp,
  fontSize = el.fontSize
): CenterTextVisualMetrics {
  const lines = getCenterTextLines(el.text);
  if (lines.length === 0) {
    return {
      maxWidthOccupancy: 0,
      heightOccupancy: 0,
      topClearance: Number.POSITIVE_INFINITY,
      bottomClearance: Number.POSITIVE_INFINITY,
    };
  }

  const safeBounds = getStampSafeBounds(stamp);
  const contentBounds = getStampContentBounds(stamp);
  const x = (el.x / 100) * CANVAS_SIZE;
  const y = (el.y / 100) * CANVAS_SIZE;
  const lineYs = getCenterTextLineYs(y, fontSize, lines.length);
  const blockTop = lineYs[0]! - fontSize * 0.6;
  const blockBottom = lineYs[lineYs.length - 1]! + fontSize * 0.6;
  const blockHeight = blockBottom - blockTop;

  const widthOccupancies = lines.map((line, idx) => {
    const width = line.length * fontSize * ARIAL_BOLD_CHAR_WIDTH_RATIO;
    const safeWidth =
      getShapeHalfWidthAtY(
        stamp,
        { ...safeBounds, safeRx: contentBounds.contentRx, safeRy: contentBounds.contentRy },
        lineYs[idx]!
      ) *
      2 *
      CENTER_TEXT_WIDTH_FACTOR;
    return safeWidth > 0 ? (Math.abs(x - CANVAS_CENTER) * 2 + width) / safeWidth : Number.POSITIVE_INFINITY;
  });

  return {
    maxWidthOccupancy: Math.max(...widthOccupancies),
    heightOccupancy: blockHeight / Math.max(contentBounds.contentRy * 2, 1),
    topClearance: blockTop - (CANVAS_CENTER - contentBounds.contentRy),
    bottomClearance: CANVAS_CENTER + contentBounds.contentRy - blockBottom,
  };
}

export function fitCenterTextElementFontSize(
  el: CenterTextElement,
  stamp: Stamp,
  maxFontSize = el.fontSize
): number {
  for (let fontSize = Math.floor(maxFontSize); fontSize >= 3; fontSize--) {
    if (doesCenterTextFit(el, stamp, fontSize)) return fontSize;
  }
  return 3;
}

function renderCenterText(el: CenterTextElement): string {
  const x = (el.x / 100) * CANVAS_SIZE;
  const y = (el.y / 100) * CANVAS_SIZE;
  const fontStyle = `font-family="${el.font}" font-size="${el.fontSize}"${el.bold ? ' font-weight="bold"' : ''}${el.italic ? ' font-style="italic"' : ''}`;
  const lines = getCenterTextLines(el.text);

  if (lines.length <= 1) {
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" fill="${el.color}" ${fontStyle} text-anchor="middle" dominant-baseline="central">${escapeXml(lines[0] ?? el.text)}</text>`;
  }

  const lineYs = getCenterTextLineYs(y, el.fontSize, lines.length);
  return lines
    .map(
      (line, idx) =>
        `<text x="${x.toFixed(1)}" y="${lineYs[idx]!.toFixed(1)}" fill="${el.color}" ${fontStyle} text-anchor="middle" dominant-baseline="central">${escapeXml(line)}</text>`
    )
    .join("\n");
}

// ─── Image element renderer ───────────────────────────────────────────────────
function renderImage(el: ImageElement): string {
  const x = (el.x / 100) * CANVAS_SIZE;
  const y = (el.y / 100) * CANVAS_SIZE;
  const scale = el.scale / 100;
  return `<g transform="translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${scale.toFixed(3)})" fill="${el.color}">${el.svgContent}</g>`;
}

// ─── Element dispatcher ───────────────────────────────────────────────────────
function renderElement(el: StampElement, stamp: Stamp, idx: number): { defs: string; svg: string } {
  if (!el.visible) return { defs: "", svg: "" };
  switch (el.type) {
    case "frame": return { defs: "", svg: renderFrame(el, stamp) };
    case "text-on-path": return renderTextOnPath(el, stamp, idx);
    case "center-text": return { defs: "", svg: renderCenterText(el) };
    case "image": return { defs: "", svg: renderImage(el) };
    default: return { defs: "", svg: "" };
  }
}

// ─── Full stamp SVG renderer ──────────────────────────────────────────────────
export function renderStampSvg(stamp: Stamp, opts?: { watermark?: boolean; forExport?: boolean }): string {
  const { effects } = stamp;
  const filterId = `filter-${stamp.id}`;
  const goldId = `gold-${stamp.id}`;
  const silverId = `silver-${stamp.id}`;
  const clipId = `clip-${stamp.id}`;
  const defs: string[] = [];
  defs.push(getClipPath(stamp, clipId));
  if (effects.shabby) defs.push(getShabbyFilter(filterId));
  if (effects.gold) defs.push(getGoldFilter(goldId));
  if (effects.silver) defs.push(getSilverFilter(silverId));
  const filterAttr = effects.shabby ? ` filter="url(#${filterId})"` : "";
  // Collect element defs (e.g. textPath paths) and SVG bodies separately
  // so all defs are hoisted to top-level <defs> and never inside a clipped group
  const elementResults = stamp.elements.map((el, idx) => renderElement(el, stamp, idx));
  elementResults.forEach(r => { if (r && r.defs) defs.push(r.defs); });
  const elementsHtml = elementResults.map(r => r ? r.svg : "").join("\n");
  // Separate text-on-path elements from other elements.
  // Text-on-path is rendered OUTSIDE the clip group to prevent the stamp shape
  // clip-path from truncating glyphs that sit near the plate boundary.
  // The clip group is only needed for frame/background fills.
  const clippedElements: string[] = [];
  const unclippedElements: string[] = [];
  stamp.elements.forEach((el, idx) => {
    const result = elementResults[idx];
    if (!result || !result.svg) return;
    if (el.type === "text-on-path") {
      unclippedElements.push(result.svg);
    } else {
      clippedElements.push(result.svg);
    }
  });
  const watermarkHtml = opts?.watermark
    ? `<text x="${CANVAS_CENTER}" y="${CANVAS_CENTER + 30}" fill="rgba(0,0,0,0.15)" font-size="12" font-family="Arial" text-anchor="middle" transform="rotate(-30, ${CANVAS_CENTER}, ${CANVAS_CENTER})">PREVIEW — stampelo.com</text>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}">
  <defs>${defs.join("\n")}</defs>
  <g clip-path="url(#${clipId})"${filterAttr}>
    ${clippedElements.join("\n")}
  </g>
  ${unclippedElements.join("\n")}
  ${watermarkHtml}
</svg>`;
}

// ─── XML escape helper ────────────────────────────────────────────────────────
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ─── Stamp geometry helpers ───────────────────────────────────────────────────
//
// These helpers operate in SVG coordinate space (CANVAS_SIZE=250).
// They are independent of viewport zoom and safe to use in createDefaultStamp(),
// template generation, and future user text auto-fit.
//
// Canonical inner safe area:
//   maxR           = (widthMm / 150) * (CANVAS_SIZE / 2) * 0.95
//   frameR         = frameRadiusPct/100 * maxR
//   frameInnerEdge = frameR - frameStrokeWidth / 2
//   safeInnerR     = frameInnerEdge - INNER_SAFETY_MARGIN
//
// Text-on-path glyph outer edge (not inverted):
//   glyphTop = arcRadius + fontSize * ARC_ASCENDER_RATIO
//   Safe: glyphTop + ARC_EXTRA_GAP <= safeInnerR
//
// Center text width (Arial Bold approximation):
//   totalWidth = numChars * fontSize * ARIAL_BOLD_CHAR_WIDTH_RATIO
//   Safe: totalWidth <= safeInnerR * 2 * CENTER_TEXT_WIDTH_FACTOR

export interface StampSafeGeometry {
  maxR: number;
  safeInnerR: number;
  maxArcRadius: number;
  maxCenterFontSize: number;
}

export function getStampSafeGeometry(
  widthMm: number,
  frameRadiusPct = 95,
  frameStrokeWidth = 3
): StampSafeGeometry {
  const maxR = (widthMm / 150) * (CANVAS_SIZE / 2) * 0.95;
  const frameR = (frameRadiusPct / 100) * maxR;
  const frameInnerEdge = frameR - frameStrokeWidth / 2;
  const safeInnerR = frameInnerEdge - INNER_SAFETY_MARGIN;
  const defaultArcFontSize = 10;
  const maxArcRadius = safeInnerR - defaultArcFontSize * ARC_ASCENDER_RATIO - ARC_EXTRA_GAP;
  const maxCenterFontSize = (safeInnerR * 2 * CENTER_TEXT_WIDTH_FACTOR) / (5 * ARIAL_BOLD_CHAR_WIDTH_RATIO);
  return { maxR, safeInnerR, maxArcRadius, maxCenterFontSize };
}

export function fitCenterTextFontSize(
  text: string,
  safeInnerR: number,
  maxFontSize = 24
): number {
  const numChars = text.length;
  if (numChars === 0) return maxFontSize;
  const availableWidth = safeInnerR * 2 * CENTER_TEXT_WIDTH_FACTOR;
  const fontSize = availableWidth / (numChars * ARIAL_BOLD_CHAR_WIDTH_RATIO);
  return Math.min(maxFontSize, Math.max(4, Math.floor(fontSize)));
}

export function fitArcTextRadius(
  fontSize: number,
  safeInnerR: number,
  maxR: number
): { radiusSvg: number; radiusPct: number } {
  const radiusSvg = safeInnerR - fontSize * ARC_ASCENDER_RATIO - ARC_EXTRA_GAP;
  const radiusPct = Math.floor((radiusSvg / maxR) * 100);
  return { radiusSvg, radiusPct };
}

export function fitArcTextRadiusToStamp(
  fontSize: number,
  stamp: Stamp
): { radiusSvg: number; radiusPct: number } {
  const geometry = getStampPlateGeometry(stamp);
  const baseRadius = geometry.maxRy;
  const outerFrameInnerEdge = getOuterFrameInnerEdge(stamp);
  const innerFrameOuterEdge = getNearestInnerFrameOuterEdge(stamp);
  const outerLimitedRadius = outerFrameInnerEdge - fontSize * ARC_ASCENDER_RATIO - ARC_RENDER_OUTER_CLEARANCE;
  if (innerFrameOuterEdge === null) {
    const radiusSvg = Math.max(outerLimitedRadius, 1);
    return {
      radiusSvg,
      radiusPct: Math.floor((radiusSvg / baseRadius) * 100),
    };
  }

  const innerLimitedRadius = innerFrameOuterEdge + fontSize * ARC_INNER_BODY_RATIO + 3;
  const radiusSvg = Math.max(Math.min(outerLimitedRadius, Math.max(innerLimitedRadius, 1)), 1);
  return {
    radiusSvg,
    radiusPct: Math.floor((radiusSvg / baseRadius) * 100),
  };
}

export function getTextOnPathVisualMetrics(
  el: TextOnPathElement,
  stamp: Stamp,
  fontSize = el.fontSize,
  letterSpacing = el.letterSpacing,
  radiusPct = el.radius
): TextOnPathVisualMetrics {
  const geometry = getTextPathGeometry({ ...el, fontSize, letterSpacing, radius: radiusPct }, stamp);
  const requiredLength = getRequiredArcLength(el.text.length, fontSize, letterSpacing);
  const outerFrameInnerEdge = getOuterFrameInnerEdge(stamp);
  const innerFrameOuterEdge = getNearestInnerFrameOuterEdge(stamp);
  const outerClearance = outerFrameInnerEdge - (geometry.ry + fontSize * ARC_ASCENDER_RATIO);
  const innerClearance =
    innerFrameOuterEdge === null ? null : geometry.ry - fontSize * ARC_INNER_BODY_RATIO - innerFrameOuterEdge;
  const bandWidth = innerFrameOuterEdge === null ? null : outerFrameInnerEdge - innerFrameOuterEdge;
  const textBandThickness = fontSize * (ARC_ASCENDER_RATIO + ARC_INNER_BODY_RATIO);
  const contentBounds = getStampContentBounds(stamp);
  const centerRegionClearance =
    contentBounds.source === "inner-frame" ? geometry.ry - contentBounds.contentRy : null;

  return {
    geometry,
    requiredLength,
    occupancy: geometry.pathLength > 0 ? requiredLength / geometry.pathLength : Number.POSITIVE_INFINITY,
    outerClearance,
    innerClearance,
    bandWidth,
    bandOccupancy: bandWidth && bandWidth > 0 ? textBandThickness / bandWidth : null,
    centerRegionClearance,
  };
}

export function doesTextOnPathCollideFrame(
  stamp: Stamp,
  radiusPct: number,
  fontSize: number
): boolean {
  const probe: TextOnPathElement = {
    id: "probe",
    type: "text-on-path",
    color: stamp.color,
    visible: true,
    text: "PROBE",
    font: "Arial",
    fontSize,
    bold: true,
    italic: false,
    align: "center",
    inverse: false,
    radius: radiusPct,
    letterSpacing: 100,
    startAngle: 0,
  };
  const metrics = getTextOnPathVisualMetrics(probe, stamp, fontSize, 100, radiusPct);
  return metrics.outerClearance < 0 || (metrics.innerClearance !== null && metrics.innerClearance < 0);
}

export function doesTextOnPathFit(
  el: TextOnPathElement,
  stamp: Stamp,
  fontSize = el.fontSize,
  letterSpacing = el.letterSpacing,
  radiusPct = el.radius
): boolean {
  const metrics = getTextOnPathVisualMetrics(el, stamp, fontSize, letterSpacing, radiusPct);
  return metrics.occupancy <= ARC_VISUAL_SAFE_OCCUPANCY;
}
