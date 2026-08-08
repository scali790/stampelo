import { describe, expect, it } from "vitest";
import { TEMPLATE_CURATION_BATCH_1 } from "../shared/templateCurationBatch1";
import { renderStampSvg } from "../client/src/editor/svgUtils";

const EXPECTED_SLUGS = [
  "status-approved-1",
  "status-rejected-1",
  "status-verified-1",
  "status-completed-1",
  "status-pending-1",
  "status-quality-1",
  "status-under-review",
  "status-expired-1",
];

describe("template curation batch 1", () => {
  it("contains the expected first eight approval templates", () => {
    expect(Object.keys(TEMPLATE_CURATION_BATCH_1).sort()).toEqual(EXPECTED_SLUGS.sort());
  });

  it("uses multiple genuinely different stamp shapes", () => {
    const shapes = new Set(
      Object.values(TEMPLATE_CURATION_BATCH_1).map(state => state.stamps[0]?.shape)
    );
    expect(shapes.size).toBeGreaterThanOrEqual(4);
    expect(shapes).toContain("round");
    expect(shapes).toContain("rectangular");
    expect(shapes).toContain("oval");
    expect(shapes).toContain("triangular");
  });

  it("uses canonical editor-state element types and valid dimensions", () => {
    for (const [slug, state] of Object.entries(TEMPLATE_CURATION_BATCH_1)) {
      const stamp = state.stamps[0];
      expect(stamp, slug).toBeDefined();
      expect(stamp!.widthMm, slug).toBeGreaterThan(0);
      expect(stamp!.heightMm, slug).toBeGreaterThan(0);
      expect(state.selectedElementId, slug).toBeNull();

      for (const element of stamp!.elements) {
        expect(["frame", "text-on-path", "center-text", "image"], `${slug}:${element.id}`).toContain(element.type);
      }
    }
  });

  it("renders every curated state to non-empty SVG", () => {
    for (const [slug, state] of Object.entries(TEMPLATE_CURATION_BATCH_1)) {
      const svg = renderStampSvg(state.stamps[0]!);
      expect(svg, slug).toContain("<svg");
      expect(svg.length, slug).toBeGreaterThan(200);
    }
  });

  it("does not collapse the batch into one structural layout", () => {
    const fingerprints = new Set(
      Object.values(TEMPLATE_CURATION_BATCH_1).map(state => {
        const stamp = state.stamps[0]!;
        return JSON.stringify({
          shape: stamp.shape,
          elements: stamp.elements.map(element => element.type),
        });
      })
    );
    expect(fingerprints.size).toBeGreaterThanOrEqual(5);
  });
});
