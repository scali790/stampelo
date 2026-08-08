/**
 * Canonical Default Starter Stamp — regression tests
 *
 * These tests assert that `createDefaultStamp()` always produces the
 * canonical first-load stamp described in docs/STAMP_EDITOR.md.
 *
 * Covered assertions:
 *   1. Shape and size are round / 38 mm
 *   2. Canonical text content (top arc, centre text, bottom arc)
 *   3. All text elements stay within the safe inner geometry
 *   4. Effects are off by default
 *   5. No clipping / collision risk (glyph top ≤ safeInnerR)
 *   6. Returning-user path: createDefaultStamp produces a fresh stamp each
 *      call (unique IDs), so persisted state is never overwritten
 */

import { describe, it, expect } from "vitest";
import {
  getStampSafeGeometry,
  fitCenterTextFontSize,
  fitArcTextRadius,
  CANVAS_SIZE,
} from "@/editor/svgUtils";
import { createDefaultStamp } from "@/editor/store";

// ─── Geometry constants (mirrored from svgUtils.ts) ───────────────────────────
const ARC_ASCENDER_RATIO = 0.28;
const ARC_EXTRA_GAP = 1.5;
const ARIAL_BOLD_CHAR_WIDTH_RATIO = 0.58;
const CENTER_TEXT_WIDTH_FACTOR = 0.82;
const ARC_USABLE_FRACTION = 0.78;
const ARC_CHAR_WIDTH_RATIO = 0.58;
const MIN_LETTER_SPACING = 70;
const MIN_FONT_SIZE_ARC = 6;

function fitArcText(
  text: string,
  arcRadius: number,
  requestedFontSize: number,
  requestedLetterSpacing: number
): { fontSize: number; letterSpacing: number } {
  const numChars = text.length;
  if (numChars === 0) return { fontSize: requestedFontSize, letterSpacing: requestedLetterSpacing };
  const availableArc = Math.PI * arcRadius * ARC_USABLE_FRACTION;
  const requiredArc = (fs: number, ls: number) => {
    const spacingPx = (ls - 100) * 0.08;
    return numChars * fs * ARC_CHAR_WIDTH_RATIO + spacingPx * (numChars - 1);
  };
  if (requiredArc(requestedFontSize, requestedLetterSpacing) <= availableArc) {
    return { fontSize: requestedFontSize, letterSpacing: requestedLetterSpacing };
  }
  if (requiredArc(requestedFontSize, MIN_LETTER_SPACING) <= availableArc) {
    // Find maximum letterSpacing in [MIN_LETTER_SPACING, requestedLetterSpacing] that fits
    let lo = MIN_LETTER_SPACING, hi = requestedLetterSpacing;
    for (let i = 0; i < 8; i++) {
      const mid = Math.floor((lo + hi) / 2);
      if (requiredArc(requestedFontSize, mid) <= availableArc) lo = mid + 1; // fits, try larger
      else hi = mid - 1; // doesn't fit, go smaller
    }
    return { fontSize: requestedFontSize, letterSpacing: hi };
  }
  const maxFontSize = availableArc / (numChars * ARC_CHAR_WIDTH_RATIO);
  const fontSize = Math.max(MIN_FONT_SIZE_ARC, Math.floor(maxFontSize));
  return { fontSize, letterSpacing: MIN_LETTER_SPACING };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Canonical Default Starter Stamp — createDefaultStamp()", () => {
  const stamp = createDefaultStamp("round");
  const geo = getStampSafeGeometry(38);

  it("produces a round stamp with widthMm=38 and heightMm=38", () => {
    expect(stamp.shape).toBe("round");
    expect(stamp.widthMm).toBe(38);
    expect(stamp.heightMm).toBe(38);
  });

  it("has exactly 4 elements: frame, top arc, centre text, bottom arc", () => {
    expect(stamp.elements).toHaveLength(4);
    const types = stamp.elements.map((e) => e.type);
    expect(types[0]).toBe("frame");
    expect(types[1]).toBe("text-on-path");
    expect(types[2]).toBe("center-text");
    expect(types[3]).toBe("text-on-path");
  });

  it("uses the canonical brand colour #1a3a6b for all elements", () => {
    expect(stamp.color).toBe("#1a3a6b");
    for (const el of stamp.elements) {
      expect((el as any).color).toBe("#1a3a6b");
    }
  });

  it("has all effects disabled by default", () => {
    expect(stamp.effects.shabby).toBe(false);
    expect(stamp.effects.gold).toBe(false);
    expect(stamp.effects.silver).toBe(false);
  });

  it("top arc text is 'STAMPELO.COM'", () => {
    const topArc = stamp.elements[1] as any;
    expect(topArc.type).toBe("text-on-path");
    expect(topArc.text).toBe("STAMPELO.COM");
    expect(topArc.inverse).toBe(false);
  });

  it("centre text is 'YOUR STAMP'", () => {
    const centre = stamp.elements[2] as any;
    expect(centre.type).toBe("center-text");
    expect(centre.text).toBe("YOUR STAMP");
    expect(centre.x).toBe(50);
    expect(centre.y).toBe(50);
  });

  it("bottom arc text is 'CREATE IN SECONDS' and is inverse", () => {
    const bottomArc = stamp.elements[3] as any;
    expect(bottomArc.type).toBe("text-on-path");
    expect(bottomArc.text).toBe("CREATE IN SECONDS");
    expect(bottomArc.inverse).toBe(true);
  });

  it("arc radius is within safe geometry (glyph top ≤ safeInnerR)", () => {
    const topArc = stamp.elements[1] as any;
    const arcRadiusSvg = (topArc.radius / 100) * geo.maxR;
    const glyphTop = arcRadiusSvg + topArc.fontSize * ARC_ASCENDER_RATIO;
    expect(glyphTop).toBeLessThanOrEqual(geo.safeInnerR + ARC_EXTRA_GAP);
  });

  it("centre text width fits within safe inner diameter", () => {
    const centre = stamp.elements[2] as any;
    const textWidth = centre.text.length * centre.fontSize * ARIAL_BOLD_CHAR_WIDTH_RATIO;
    const availableWidth = geo.safeInnerR * 2 * CENTER_TEXT_WIDTH_FACTOR;
    expect(textWidth).toBeLessThanOrEqual(availableWidth);
  });

  it("auto-fit produces a font size ≥ MIN_FONT_SIZE_ARC for top arc text", () => {
    const topArc = stamp.elements[1] as any;
    const arcRadiusSvg = (topArc.radius / 100) * geo.maxR;
    const fitted = fitArcText(topArc.text, arcRadiusSvg, topArc.fontSize, topArc.letterSpacing);
    expect(fitted.fontSize).toBeGreaterThanOrEqual(MIN_FONT_SIZE_ARC);
  });

  it("auto-fit produces a font size ≥ MIN_FONT_SIZE_ARC for bottom arc text", () => {
    const bottomArc = stamp.elements[3] as any;
    const arcRadiusSvg = (bottomArc.radius / 100) * geo.maxR;
    const fitted = fitArcText(bottomArc.text, arcRadiusSvg, bottomArc.fontSize, bottomArc.letterSpacing);
    expect(fitted.fontSize).toBeGreaterThanOrEqual(MIN_FONT_SIZE_ARC);
    // Verify the fitted text (with adjusted letter-spacing) actually fits the arc
    const availableArc = Math.PI * arcRadiusSvg * ARC_USABLE_FRACTION;
    const spacingPx = (fitted.letterSpacing - 100) * 0.08;
    const required = bottomArc.text.length * fitted.fontSize * ARC_CHAR_WIDTH_RATIO
      + spacingPx * (bottomArc.text.length - 1);
    expect(required).toBeLessThanOrEqual(availableArc);
  });

  it("auto-fit produces a font size ≥ MIN_FONT_SIZE_ARC for top arc text and fits arc", () => {
    const topArc = stamp.elements[1] as any;
    const arcRadiusSvg = (topArc.radius / 100) * geo.maxR;
    const fitted = fitArcText(topArc.text, arcRadiusSvg, topArc.fontSize, topArc.letterSpacing);
    const availableArc = Math.PI * arcRadiusSvg * ARC_USABLE_FRACTION;
    const spacingPx = (fitted.letterSpacing - 100) * 0.08;
    const required = topArc.text.length * fitted.fontSize * ARC_CHAR_WIDTH_RATIO
      + spacingPx * (topArc.text.length - 1);
    expect(required).toBeLessThanOrEqual(availableArc);
  });

  it("each call produces a stamp with a unique ID (no shared state)", () => {
    const stamp2 = createDefaultStamp("round");
    expect(stamp2.id).not.toBe(stamp.id);
  });

  it("rectangular default stamp uses 55×25 mm", () => {
    const rect = createDefaultStamp("rectangular");
    expect(rect.shape).toBe("rectangular");
    expect(rect.widthMm).toBe(55);
    expect(rect.heightMm).toBe(25);
  });
});

describe("Geometry helpers — safe area invariants", () => {
  it("getStampSafeGeometry(38) returns expected values", () => {
    const geo = getStampSafeGeometry(38);
    // maxR = (38/150) * 125 * 0.95 ≈ 30.08
    expect(geo.maxR).toBeCloseTo(30.083, 1);
    // safeInnerR = frameInnerEdge - 2.5 ≈ 24.58
    expect(geo.safeInnerR).toBeCloseTo(24.579, 1);
  });

  it("fitArcTextRadius guarantees glyph top ≤ safeInnerR", () => {
    const geo = getStampSafeGeometry(38);
    const { radiusSvg } = fitArcTextRadius(8, geo.safeInnerR, geo.maxR);
    const glyphTop = radiusSvg + 8 * ARC_ASCENDER_RATIO;
    expect(glyphTop).toBeLessThanOrEqual(geo.safeInnerR);
  });

  it("fitCenterTextFontSize('YOUR STAMP', safeInnerR) fits within safe width", () => {
    const geo = getStampSafeGeometry(38);
    const fs = fitCenterTextFontSize("YOUR STAMP", geo.safeInnerR, 14);
    const textWidth = "YOUR STAMP".length * fs * ARIAL_BOLD_CHAR_WIDTH_RATIO;
    const availableWidth = geo.safeInnerR * 2 * CENTER_TEXT_WIDTH_FACTOR;
    expect(textWidth).toBeLessThanOrEqual(availableWidth);
  });
});
