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
// Returns { defs, svg } so defs can be hoisted to top-level <defs>
function renderTextOnPath(el: TextOnPathElement, stamp: Stamp, elIdx: number): { defs: string; svg: string } {
  const cx = CANVAS_CENTER;
  const cy = CANVAS_CENTER;
  const maxR = (stamp.widthMm / 150) * (CANVAS_SIZE / 2) * 0.95;
  const r = (el.radius / 100) * maxR;
  const pathId = `tp-path-${elIdx}`;
  const startAngleDeg = el.startAngle;

  // Full circle path for text on path — text starts at top (270deg = -90deg from right)
  // We use a full circle so text can start anywhere
  const startRad = ((startAngleDeg - 90) * Math.PI) / 180;
  const startX = cx + r * Math.cos(startRad);
  const startY = cy + r * Math.sin(startRad);
  // Arc: go 180 degrees then another 180 (full circle via two arcs)
  const midRad = startRad + Math.PI;
  const midX = cx + r * Math.cos(midRad);
  const midY = cy + r * Math.sin(midRad);

  let pathD: string;
  if (el.inverse) {
    // Bottom arc — text reads inside/upside-down
    pathD = `M ${startX.toFixed(2)},${startY.toFixed(2)} A ${r},${r} 0 0,0 ${midX.toFixed(2)},${midY.toFixed(2)} A ${r},${r} 0 0,0 ${startX.toFixed(2)},${startY.toFixed(2)}`;
  } else {
    // Top arc — normal reading direction
    pathD = `M ${startX.toFixed(2)},${startY.toFixed(2)} A ${r},${r} 0 0,1 ${midX.toFixed(2)},${midY.toFixed(2)} A ${r},${r} 0 0,1 ${startX.toFixed(2)},${startY.toFixed(2)}`;
  }

  // Auto-fit font size and letter-spacing to the available arc length.
  // This prevents text from overflowing the arc and being clipped.
  const fitted = fitArcText(el.text, r, el.fontSize, el.letterSpacing);
  const fontStyle = `font-family="${el.font}" font-size="${fitted.fontSize}"${el.bold ? ' font-weight="bold"' : ''}${el.italic ? ' font-style="italic"' : ''}`;
  const spacingPx = (fitted.letterSpacing - 100) * 0.08;
  const spacing = spacingPx !== 0 ? ` letter-spacing="${spacingPx.toFixed(2)}"` : "";
  const anchor = el.align;
  const offset = el.align === "center" ? "50%" : el.align === "right" ? "100%" : "0%";

  return {
    defs: `<path id="${pathId}" d="${pathD}" fill="none"/>`,
    svg: `<text fill="${el.color}" ${fontStyle}${spacing}>
  <textPath href="#${pathId}" startOffset="${offset}" text-anchor="${anchor}">${escapeXml(el.text)}</textPath>
</text>`,
  };
}

// ─── Arc-length auto-fit helper ───────────────────────────────────────────────
// Computes the font size and letter-spacing needed to fit text on a circular arc.
//
// Available arc = PI * r * ARC_USABLE_FRACTION  (top semicircle × usable fraction)
// Required arc  = numChars * fontSize * CHAR_WIDTH_RATIO + letterSpacingExtra
//
// Strategy:
//   1. Try the requested fontSize with the requested letterSpacing.
//   2. If it doesn't fit, reduce letterSpacing down to MIN_LETTER_SPACING.
//   3. If still doesn't fit, reduce fontSize (keeping letterSpacing at minimum).
//   4. Never go below MIN_FONT_SIZE.
//
// Returns { fontSize, letterSpacing } — both may be reduced from the input values.

const ARC_USABLE_FRACTION = 0.78;   // use 78% of top semicircle (leaves 11% margin each side)
const ARC_CHAR_WIDTH_RATIO = 0.58;  // Arial Bold average char width / fontSize
const MIN_FONT_SIZE_ARC = 6;        // minimum readable font size on arc
const MIN_LETTER_SPACING = 70;      // minimum letter-spacing (30% compression)

function fitArcText(
  text: string,
  arcRadius: number,
  requestedFontSize: number,
  requestedLetterSpacing: number
): { fontSize: number; letterSpacing: number } {
  const numChars = text.length;
  if (numChars === 0) return { fontSize: requestedFontSize, letterSpacing: requestedLetterSpacing };

  const availableArc = Math.PI * arcRadius * ARC_USABLE_FRACTION;

  // Helper: compute required arc length for given fontSize and letterSpacing
  function requiredArc(fs: number, ls: number): number {
    const spacingPx = (ls - 100) * 0.08;
    return numChars * fs * ARC_CHAR_WIDTH_RATIO + spacingPx * (numChars - 1);
  }

  // Step 1: try requested values
  if (requiredArc(requestedFontSize, requestedLetterSpacing) <= availableArc) {
    return { fontSize: requestedFontSize, letterSpacing: requestedLetterSpacing };
  }

  // Step 2: reduce letter-spacing to minimum, keep fontSize
  if (requiredArc(requestedFontSize, MIN_LETTER_SPACING) <= availableArc) {
    // Binary search for the maximum letterSpacing that still fits.
    // Since requiredArc is increasing in letterSpacing, we search for the largest
    // value in [MIN_LETTER_SPACING, requestedLetterSpacing] where req <= available.
    let lo = MIN_LETTER_SPACING, hi = requestedLetterSpacing;
    for (let i = 0; i < 8; i++) {
      const mid = Math.floor((lo + hi) / 2);
      if (requiredArc(requestedFontSize, mid) <= availableArc) lo = mid + 1; // fits, try larger
      else hi = mid - 1; // doesn't fit, go smaller
    }
    return { fontSize: requestedFontSize, letterSpacing: hi };
  }

  // Step 3: reduce fontSize (with minimum letter-spacing)
  const maxFontSize = availableArc / (numChars * ARC_CHAR_WIDTH_RATIO);
  const fontSize = Math.max(MIN_FONT_SIZE_ARC, Math.floor(maxFontSize));
  return { fontSize, letterSpacing: MIN_LETTER_SPACING };
}

// ─── Center text renderer ─────────────────────────────────────────────────────
function renderCenterText(el: CenterTextElement): string {
  const x = (el.x / 100) * CANVAS_SIZE;
  const y = (el.y / 100) * CANVAS_SIZE;
  const fontStyle = `font-family="${el.font}" font-size="${el.fontSize}"${el.bold ? ' font-weight="bold"' : ''}${el.italic ? ' font-style="italic"' : ''}`;
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" fill="${el.color}" ${fontStyle} text-anchor="middle" dominant-baseline="central">${escapeXml(el.text)}</text>`;
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

const INNER_SAFETY_MARGIN = 2.5;
const ARC_ASCENDER_RATIO = 0.28;
const ARC_EXTRA_GAP = 1.5;
const ARIAL_BOLD_CHAR_WIDTH_RATIO = 0.58;
const CENTER_TEXT_WIDTH_FACTOR = 0.82;

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
  return Math.min(maxFontSize, Math.max(6, Math.floor(fontSize)));
}

export function fitArcTextRadius(
  fontSize: number,
  safeInnerR: number,
  maxR: number
): { radiusSvg: number; radiusPct: number } {
  const radiusSvg = safeInnerR - fontSize * ARC_ASCENDER_RATIO - ARC_EXTRA_GAP;
  const radiusPct = Math.round((radiusSvg / maxR) * 100);
  return { radiusSvg, radiusPct };
}
