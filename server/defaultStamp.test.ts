import { describe, expect, it } from "vitest";
import { createDefaultStamp } from "@/editor/store";
import {
  fitArcText,
  fitCenterTextFontSize,
  fitArcTextRadius,
  getStampSafeGeometry,
  getTextPathGeometry,
  renderStampSvg,
} from "@/editor/svgUtils";

const ARC_ASCENDER_RATIO = 0.28;
const ARC_EXTRA_GAP = 1.5;
const ARIAL_BOLD_CHAR_WIDTH_RATIO = 0.58;
const CENTER_TEXT_WIDTH_FACTOR = 0.82;

function getStarterElements() {
  const stamp = createDefaultStamp("round");
  const frame = stamp.elements.find((el) => el.type === "frame");
  const center = stamp.elements.find((el) => el.type === "center-text");
  const topArc = stamp.elements.find(
    (el) => el.type === "text-on-path" && el.text === "STAMPELO.COM"
  );
  const bottomArc = stamp.elements.find(
    (el) => el.type === "text-on-path" && el.text === "CREATE IN SECONDS"
  );

  if (!frame || !center || !topArc || !bottomArc) {
    throw new Error("starter stamp is missing required elements");
  }

  return { stamp, frame, center, topArc, bottomArc };
}

describe("Canonical Default Starter Stamp — createDefaultStamp()", () => {
  const { stamp, frame, center, topArc, bottomArc } = getStarterElements();
  const geometry = getStampSafeGeometry(38);

  it("produces a round 38 mm stamp with the canonical 4-element structure", () => {
    expect(stamp.shape).toBe("round");
    expect(stamp.widthMm).toBe(38);
    expect(stamp.heightMm).toBe(38);
    expect(stamp.elements.map((el) => el.type)).toEqual([
      "frame",
      "text-on-path",
      "center-text",
      "text-on-path",
    ]);
  });

  it("uses the canonical starter text and leaves effects disabled", () => {
    expect(topArc.text).toBe("STAMPELO.COM");
    expect(center.text).toBe("YOUR STAMP");
    expect(bottomArc.text).toBe("CREATE IN SECONDS");
    expect(stamp.effects).toEqual({ shabby: false, gold: false, silver: false });
  });

  it("derives the arc baseline radius from the safe geometry helpers", () => {
    const { radiusPct } = fitArcTextRadius(topArc.fontSize, geometry.safeInnerR, geometry.maxR);
    expect(topArc.radius).toBe(radiusPct);
    expect(bottomArc.radius).toBe(radiusPct);
  });

  it("centers the top arc on 12 o'clock with a clockwise left-to-right sweep", () => {
    const arc = getTextPathGeometry(topArc, stamp);
    expect(arc.role).toBe("top");
    expect(arc.centerAngleDeg).toBe(0);
    expect(arc.startAngleDeg).toBe(280);
    expect(arc.endAngleDeg).toBe(80);
    expect(arc.sweepFlag).toBe(1);
    expect(arc.largeArcFlag).toBe(0);
  });

  it("centers the bottom arc on 6 o'clock with a counterclockwise left-to-right sweep", () => {
    const arc = getTextPathGeometry(bottomArc, stamp);
    expect(arc.role).toBe("bottom");
    expect(arc.centerAngleDeg).toBe(180);
    expect(arc.startAngleDeg).toBe(260);
    expect(arc.endAngleDeg).toBe(100);
    expect(arc.sweepFlag).toBe(0);
    expect(arc.largeArcFlag).toBe(0);
  });

  it("fits both arc strings into the usable path length", () => {
    const topGeometry = getTextPathGeometry(topArc, stamp);
    const bottomGeometry = getTextPathGeometry(bottomArc, stamp);
    const fittedTop = fitArcText(topArc.text, topGeometry.pathLength, topArc.fontSize, topArc.letterSpacing);
    const fittedBottom = fitArcText(
      bottomArc.text,
      bottomGeometry.pathLength,
      bottomArc.fontSize,
      bottomArc.letterSpacing
    );

    const requiredTop =
      topArc.text.length * fittedTop.fontSize * 0.58 +
      ((fittedTop.letterSpacing - 100) * 0.08) * (topArc.text.length - 1);
    const requiredBottom =
      bottomArc.text.length * fittedBottom.fontSize * 0.58 +
      ((fittedBottom.letterSpacing - 100) * 0.08) * (bottomArc.text.length - 1);

    expect(requiredTop).toBeLessThanOrEqual(topGeometry.pathLength * 0.92);
    expect(requiredBottom).toBeLessThanOrEqual(bottomGeometry.pathLength * 0.92);
  });

  it("keeps both arc baselines inside the frame-safe radius", () => {
    const topRadiusSvg = (topArc.radius / 100) * geometry.maxR;
    const bottomRadiusSvg = (bottomArc.radius / 100) * geometry.maxR;

    expect(topRadiusSvg + topArc.fontSize * ARC_ASCENDER_RATIO + ARC_EXTRA_GAP)
      .toBeLessThanOrEqual(geometry.safeInnerR);
    expect(bottomRadiusSvg + bottomArc.fontSize * ARC_ASCENDER_RATIO + ARC_EXTRA_GAP)
      .toBeLessThanOrEqual(geometry.safeInnerR);
  });

  it("keeps the center text inside the inner safe width with clear room to the arc baselines", () => {
    const availableWidth = geometry.safeInnerR * 2 * CENTER_TEXT_WIDTH_FACTOR;
    const centerWidth = center.text.length * center.fontSize * ARIAL_BOLD_CHAR_WIDTH_RATIO;
    const topArcRadius = (topArc.radius / 100) * geometry.maxR;
    const bottomArcRadius = (bottomArc.radius / 100) * geometry.maxR;
    const centerHalfHeight = center.fontSize / 2;

    expect(centerWidth).toBeLessThanOrEqual(availableWidth);
    expect(fitCenterTextFontSize(center.text, geometry.safeInnerR, 7)).toBe(center.fontSize);
    expect(topArcRadius - centerHalfHeight).toBeGreaterThan(12);
    expect(bottomArcRadius - centerHalfHeight).toBeGreaterThan(12);
  });

  it("renders SVG paths that match the computed top and bottom arc geometry", () => {
    const svg = renderStampSvg(stamp);
    const topGeometry = getTextPathGeometry(topArc, stamp);
    const bottomGeometry = getTextPathGeometry(bottomArc, stamp);

    expect(svg).toContain(topGeometry.pathD);
    expect(svg).toContain(bottomGeometry.pathD);
    expect(svg).toContain(">STAMPELO.COM</textPath>");
    expect(svg).toContain(">CREATE IN SECONDS</textPath>");
  });

  it("returns a fresh stamp id on each factory call", () => {
    expect(createDefaultStamp("round").id).not.toBe(stamp.id);
  });

  it("keeps rectangular starter defaults unchanged", () => {
    const rect = createDefaultStamp("rectangular");
    expect(rect.shape).toBe("rectangular");
    expect(rect.widthMm).toBe(55);
    expect(rect.heightMm).toBe(25);
  });

  it("uses the canonical frame stroke and radius", () => {
    expect(frame.radius).toBe(95);
    expect(frame.strokeWidth).toBe(3);
    expect(frame.lineBreak).toBe(0);
  });
});

describe("Geometry helpers — safe area invariants", () => {
  it("getStampSafeGeometry(38) returns stable round-stamp bounds", () => {
    const geometry = getStampSafeGeometry(38);
    expect(geometry.maxR).toBeCloseTo(30.083, 1);
    expect(geometry.safeInnerR).toBeCloseTo(24.579, 1);
  });

  it("fitArcTextRadius keeps glyph tops inside safeInnerR", () => {
    const geometry = getStampSafeGeometry(38);
    const { radiusSvg } = fitArcTextRadius(6, geometry.safeInnerR, geometry.maxR);
    const glyphTop = radiusSvg + 6 * ARC_ASCENDER_RATIO;
    expect(glyphTop + ARC_EXTRA_GAP).toBeLessThanOrEqual(geometry.safeInnerR);
  });

  it("fitCenterTextFontSize('YOUR STAMP', safeInnerR, 7) matches the starter center size", () => {
    const geometry = getStampSafeGeometry(38);
    expect(fitCenterTextFontSize("YOUR STAMP", geometry.safeInnerR, 7)).toBe(6);
  });
});
