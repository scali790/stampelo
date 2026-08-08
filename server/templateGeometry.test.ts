import { describe, expect, it } from "vitest";
import { createDefaultStamp } from "@/editor/store";
import {
  ARC_MIN_READABLE_LETTER_SPACING,
  fitArcText,
  getTextPathGeometry,
  renderStampSvg,
} from "@/editor/svgUtils";
import { RAW_TEMPLATE_RECORDS } from "./seed300Templates";
import { auditTemplateStampGeometry, normalizeTemplateState } from "../shared/templateStateNormalization";

function summarizeTemplateAudit(repairGeometry: boolean) {
  const invalidByShape = { round: 0, oval: 0, rectangular: 0, triangular: 0, other: 0 };
  const invalidByReason = {
    arcTextOverflow: 0,
    frameCollision: 0,
    centerTextOverflow: 0,
    arcTextTooCloseToFrame: 0,
    arcTextOccupancyTooHigh: 0,
    centerTextOccupancyTooHigh: 0,
    insufficientVisualClearance: 0,
    multiRingCollisionRisk: 0,
    missingInvalidGeometry: 0,
    unsupportedState: 0,
  };

  let valid = 0;
  let invalid = 0;

  for (const record of RAW_TEMPLATE_RECORDS) {
    const stamp = normalizeTemplateState(record.stateJson, { repairGeometry }).stamps[0];
    const issues = stamp
      ? auditTemplateStampGeometry(stamp)
      : {
          arcTextOverflow: false,
          frameCollision: false,
          centerTextOverflow: false,
          arcTextTooCloseToFrame: false,
          arcTextOccupancyTooHigh: false,
          centerTextOccupancyTooHigh: false,
          insufficientVisualClearance: false,
          multiRingCollisionRisk: false,
          missingInvalidGeometry: false,
          unsupportedState: true,
        };
    const hasIssues = Object.values(issues).some(Boolean);

    if (hasIssues) {
      invalid++;
      const shape = stamp?.shape ?? record.shape;
      if (shape === "round" || shape === "oval" || shape === "rectangular" || shape === "triangular") {
        invalidByShape[shape]++;
      } else {
        invalidByShape.other++;
      }
      for (const [reason, present] of Object.entries(issues)) {
        if (present) invalidByReason[reason as keyof typeof invalidByReason]++;
      }
    } else {
      valid++;
    }
  }

  return {
    totalTemplates: RAW_TEMPLATE_RECORDS.length,
    valid,
    invalid,
    invalidByShape,
    invalidByReason,
  };
}

function getNormalizedStamp(slug: string) {
  const record = RAW_TEMPLATE_RECORDS.find((entry) => entry.slug === slug);
  if (!record) throw new Error(`Template not found: ${slug}`);
  const stamp = normalizeTemplateState(record.stateJson).stamps[0];
  if (!stamp) throw new Error(`Template state did not normalize: ${slug}`);
  return stamp;
}

describe("Template geometry audit", () => {
  it("flags the legacy source catalog as invalid before repair", () => {
    const audit = summarizeTemplateAudit(false);

    expect(audit.totalTemplates).toBe(318);
    expect(audit.invalid).toBe(318);
    expect(audit.valid).toBe(0);
    expect(audit.invalidByShape).toEqual({
      round: 161,
      oval: 10,
      rectangular: 143,
      triangular: 4,
      other: 0,
    });
    expect(audit.invalidByReason.arcTextOverflow).toBeGreaterThan(100);
    expect(audit.invalidByReason.frameCollision).toBeGreaterThan(100);
    expect(audit.invalidByReason.centerTextOverflow).toBeGreaterThan(300);
    expect(audit.invalidByReason.multiRingCollisionRisk).toBeGreaterThan(100);
  });

  it("normalizes the full 318-template catalog into safe geometry", () => {
    const audit = summarizeTemplateAudit(true);
    expect(audit.totalTemplates).toBe(318);
    expect(audit.invalid).toBe(3);
    expect(audit.valid).toBe(315);
    expect(audit.invalidByReason).toEqual({
      arcTextOverflow: 0,
      frameCollision: 0,
      centerTextOverflow: 3,
      arcTextTooCloseToFrame: 0,
      arcTextOccupancyTooHigh: 0,
      centerTextOccupancyTooHigh: 3,
      insufficientVisualClearance: 0,
      multiRingCollisionRisk: 0,
      missingInvalidGeometry: 0,
      unsupportedState: 0,
    });
  });
});

describe("Template normalization by shape", () => {
  it("keeps repaired round templates inside the geometry constraints", () => {
    const stamp = getNormalizedStamp("corp-round-seal-2");
    const issues = auditTemplateStampGeometry(stamp);
    expect(Object.values(issues).some(Boolean)).toBe(false);
  });

  it("repairs long double-ring round templates without arc-ring collision risk", () => {
    const raw = RAW_TEMPLATE_RECORDS.find((record) => record.slug === "corp-round-7")!.stateJson;
    const rawStamp = normalizeTemplateState(raw, { repairGeometry: false }).stamps[0]!;
    const repairedStamp = normalizeTemplateState(raw).stamps[0]!;

    expect(auditTemplateStampGeometry(rawStamp).multiRingCollisionRisk).toBe(true);
    expect(Object.values(auditTemplateStampGeometry(repairedStamp)).some(Boolean)).toBe(false);
  });

  it("uses semantic oval arc geometry rather than a circular fallback", () => {
    const stamp = getNormalizedStamp("corp-oval-1");
    const arc = stamp.elements.find((element) => element.type === "text-on-path");
    if (!arc || arc.type !== "text-on-path") throw new Error("Oval template is missing text-on-path");

    const geometry = getTextPathGeometry(arc, stamp);
    const issues = auditTemplateStampGeometry(stamp);

    expect(geometry.rx).toBeGreaterThan(geometry.ry);
    expect(Object.values(issues).some(Boolean)).toBe(false);
  });

  it("repairs rectangular templates without clipping their center text", () => {
    const stamp = getNormalizedStamp("corp-rect-1");
    const issues = auditTemplateStampGeometry(stamp);
    expect(Object.values(issues).some(Boolean)).toBe(false);
  });

  it("keeps accepted single-word exception labels intact and flags them for design review", () => {
    const stamp = getNormalizedStamp("per-thank-you-1");
    const issues = auditTemplateStampGeometry(stamp);
    const center = stamp.elements.find(
      (element) => element.type === "center-text" && element.text.includes("APPRECIATED")
    );

    if (!center || center.type !== "center-text") throw new Error("Thank You template is missing center text");

    expect(center.text).toBe("APPRECIATED");
    expect(center.fontSize).toBe(3);
    expect(issues.centerTextOverflow).toBe(true);
    expect(issues.centerTextOccupancyTooHigh).toBe(true);
  });

  it("keeps single-word center labels on one line when they can fit by shrinking", () => {
    const partnership = getNormalizedStamp("corp-round-4");
    const official = getNormalizedStamp("corp-round-7");
    const partnershipCenter = partnership.elements.find(
      (element) => element.type === "center-text" && element.text.includes("PARTNERS")
    );
    const officialCenter = official.elements.find(
      (element) => element.type === "center-text" && element.text.includes("AUTHORIZED")
    );

    if (!partnershipCenter || partnershipCenter.type !== "center-text") {
      throw new Error("Partnership Seal is missing center text");
    }
    if (!officialCenter || officialCenter.type !== "center-text") {
      throw new Error("Official Company Seal is missing center text");
    }

    expect(partnershipCenter.text).toBe("PARTNERS");
    expect(officialCenter.text).toBe("AUTHORIZED");
    expect(Object.values(auditTemplateStampGeometry(partnership)).some(Boolean)).toBe(false);
    expect(Object.values(auditTemplateStampGeometry(official)).some(Boolean)).toBe(false);
  });

  it("wraps multi-word center phrases only at spaces", () => {
    const stamp = getNormalizedStamp("corp-triangle-2");
    const center = stamp.elements.find(
      (element) => element.type === "center-text" && element.text.includes("BUSINESS")
    );

    if (!center || center.type !== "center-text") throw new Error("Triangle template is missing center text");

    expect(center.text).toBe("BUSINESS\nSTAMP");
    expect(Object.values(auditTemplateStampGeometry(stamp)).some(Boolean)).toBe(false);
  });

  it("wraps triangular center text when a single line cannot fit", () => {
    const stamp = getNormalizedStamp("corp-triangle-2");
    const issues = auditTemplateStampGeometry(stamp);
    const center = stamp.elements.find(
      (element) => element.type === "center-text" && element.text.includes("BUSINESS")
    );

    if (!center || center.type !== "center-text") throw new Error("Triangle template is missing center text");

    expect(center.text).toContain("\n");
    expect(center.text.split("\n")).toEqual(["BUSINESS", "STAMP"]);
    expect(Object.values(issues).some(Boolean)).toBe(false);
  });

  it("uses template-specific redesigned occasion layouts for the four approved personal templates", () => {
    const expectations = [
      { slug: "per-wedding-1", center: "WEDDING", top: "WITH LOVE", bottom: "CELEBRATION" },
      { slug: "per-engagement-1", center: "ENGAGEMENT", top: "BEST WISHES", bottom: "CELEBRATION" },
      { slug: "per-graduation-1", center: "GRADUATION", top: "CONGRATULATIONS", bottom: "ACHIEVEMENT" },
      { slug: "per-retirement-1", center: "RETIREMENT", top: "CONGRATULATIONS", bottom: "BEST WISHES" },
    ];

    for (const expected of expectations) {
      const stamp = getNormalizedStamp(expected.slug);
      const issues = auditTemplateStampGeometry(stamp);
      const arcs = stamp.elements.filter((element) => element.type === "text-on-path");
      const center = stamp.elements.find((element) => element.type === "center-text");

      if (!center || center.type !== "center-text") {
        throw new Error(`Template ${expected.slug} is missing center text`);
      }

      expect(center.text).toBe(expected.center);
      expect(arcs.some((element) => element.type === "text-on-path" && element.text === expected.top)).toBe(true);
      expect(arcs.some((element) => element.type === "text-on-path" && element.text === expected.bottom)).toBe(true);
      expect(Object.values(issues).some(Boolean)).toBe(false);
    }
  });
});

describe("Starter and shared renderer behavior", () => {
  it("keeps the canonical starter bottom arc tighter and no larger than the top arc fit", () => {
    const stamp = createDefaultStamp("round");
    const topArc = stamp.elements.find(
      (element) => element.type === "text-on-path" && element.text === "STAMPELO.COM"
    );
    const bottomArc = stamp.elements.find(
      (element) => element.type === "text-on-path" && element.text === "CREATE IN SECONDS"
    );

    if (!topArc || topArc.type !== "text-on-path" || !bottomArc || bottomArc.type !== "text-on-path") {
      throw new Error("Starter stamp is missing arc text");
    }

    const topGeometry = getTextPathGeometry(topArc, stamp);
    const bottomGeometry = getTextPathGeometry(bottomArc, stamp);
    const fittedTop = fitArcText(topArc.text, topGeometry.pathLength, topArc.fontSize, topArc.letterSpacing);
    const fittedBottom = fitArcText(
      bottomArc.text,
      bottomGeometry.pathLength,
      bottomArc.fontSize,
      bottomArc.letterSpacing
    );

    expect(topGeometry.startAngleDeg).toBe(290);
    expect(topGeometry.endAngleDeg).toBe(70);
    expect(bottomGeometry.startAngleDeg).toBe(250);
    expect(bottomGeometry.endAngleDeg).toBe(110);
    expect(fittedBottom.fontSize).toBeLessThanOrEqual(fittedTop.fontSize);
  });

  it("reduces arc font size before crossing the readable tracking floor", () => {
    const raw = RAW_TEMPLATE_RECORDS.find((record) => record.slug === "corp-round-7")!.stateJson;
    const stamp = normalizeTemplateState(raw, { repairGeometry: false }).stamps[0]!;
    const arc = stamp.elements.find((element) => element.type === "text-on-path");
    if (!arc || arc.type !== "text-on-path") throw new Error("Official Company Seal is missing arc text");

    const geometry = getTextPathGeometry(arc, stamp);
    const fitted = fitArcText(arc.text, geometry.pathLength, arc.fontSize, arc.letterSpacing);

    expect(fitted.fontSize).toBeLessThan(arc.fontSize);
    expect(fitted.letterSpacing).toBeGreaterThanOrEqual(ARC_MIN_READABLE_LETTER_SPACING);
  });

  it("keeps long round control arcs above the readable tracking floor", () => {
    for (const slug of ["corp-round-4", "corp-round-7"]) {
      const stamp = getNormalizedStamp(slug);
      const arc = stamp.elements.find((element) => element.type === "text-on-path");
      if (!arc || arc.type !== "text-on-path") throw new Error(`Template ${slug} is missing arc text`);

      expect(arc.letterSpacing).toBeGreaterThanOrEqual(ARC_MIN_READABLE_LETTER_SPACING);
    }
  });

  it("renders the same normalized template SVG for preview and editor-loaded state", () => {
    const raw = RAW_TEMPLATE_RECORDS.find((record) => record.slug === "corp-round-seal-1")!.stateJson;
    const previewState = normalizeTemplateState(raw);
    const editorState = normalizeTemplateState(JSON.parse(JSON.stringify(raw)));

    expect(renderStampSvg(previewState.stamps[0]!)).toBe(renderStampSvg(editorState.stamps[0]!));
  });
});
