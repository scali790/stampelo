import { describe, expect, it } from "vitest";
import { createDefaultStamp } from "@/editor/store";
import { fitArcText, getTextPathGeometry, renderStampSvg } from "@/editor/svgUtils";
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
    expect(audit.invalid).toBe(0);
    expect(audit.valid).toBe(318);
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

  it("shrinks long single-word center text until it respects the visual cap", () => {
    const stamp = getNormalizedStamp("per-graduation-1");
    const issues = auditTemplateStampGeometry(stamp);
    const center = stamp.elements.find(
      (element) => element.type === "center-text" && element.text === "CONGRATULATIONS"
    );

    if (!center || center.type !== "center-text") throw new Error("Graduation template is missing center text");

    expect(center.fontSize).toBe(3);
    expect(Object.values(issues).some(Boolean)).toBe(false);
  });

  it("wraps triangular center text when a single line cannot fit", () => {
    const stamp = getNormalizedStamp("corp-triangle-2");
    const issues = auditTemplateStampGeometry(stamp);
    const center = stamp.elements.find(
      (element) => element.type === "center-text" && element.text.includes("BUSINESS")
    );

    if (!center || center.type !== "center-text") throw new Error("Triangle template is missing center text");

    expect(center.text).toContain("\n");
    expect(Object.values(issues).some(Boolean)).toBe(false);
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

  it("renders the same normalized template SVG for preview and editor-loaded state", () => {
    const raw = RAW_TEMPLATE_RECORDS.find((record) => record.slug === "corp-round-seal-1")!.stateJson;
    const previewState = normalizeTemplateState(raw);
    const editorState = normalizeTemplateState(JSON.parse(JSON.stringify(raw)));

    expect(renderStampSvg(previewState.stamps[0]!)).toBe(renderStampSvg(editorState.stamps[0]!));
  });
});
