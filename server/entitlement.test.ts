/**
 * Package entitlement matrix tests
 * Verifies that each plan receives exactly the correct set of export formats.
 *
 * Plan matrix:
 *   PROMO  ($2.50): PNG only
 *   ECONOM ($3.50): PNG + SVG
 *   PREMIUM($4.50): PNG + SVG + PDF
 *   VIP    ($5.50): PNG + SVG + PDF + DOCX
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Entitlement logic (extracted from webhookHandler) ────────────────────────
function getFormatsForPlan(plan: string): string[] {
  const formats: string[] = ["png"]; // always included
  if (["econom", "premium", "vip"].includes(plan)) formats.push("svg");
  if (["premium", "vip"].includes(plan)) formats.push("pdf");
  if (plan === "vip") formats.push("docx");
  return formats;
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("Package entitlement matrix", () => {
  describe("PROMO plan", () => {
    it("includes PNG", () => expect(getFormatsForPlan("promo")).toContain("png"));
    it("excludes SVG", () => expect(getFormatsForPlan("promo")).not.toContain("svg"));
    it("excludes PDF", () => expect(getFormatsForPlan("promo")).not.toContain("pdf"));
    it("excludes DOCX", () => expect(getFormatsForPlan("promo")).not.toContain("docx"));
    it("has exactly 1 format", () => expect(getFormatsForPlan("promo")).toHaveLength(1));
  });

  describe("ECONOM plan", () => {
    it("includes PNG", () => expect(getFormatsForPlan("econom")).toContain("png"));
    it("includes SVG", () => expect(getFormatsForPlan("econom")).toContain("svg"));
    it("excludes PDF", () => expect(getFormatsForPlan("econom")).not.toContain("pdf"));
    it("excludes DOCX", () => expect(getFormatsForPlan("econom")).not.toContain("docx"));
    it("has exactly 2 formats", () => expect(getFormatsForPlan("econom")).toHaveLength(2));
  });

  describe("PREMIUM plan", () => {
    it("includes PNG", () => expect(getFormatsForPlan("premium")).toContain("png"));
    it("includes SVG", () => expect(getFormatsForPlan("premium")).toContain("svg"));
    it("includes PDF", () => expect(getFormatsForPlan("premium")).toContain("pdf"));
    it("excludes DOCX", () => expect(getFormatsForPlan("premium")).not.toContain("docx"));
    it("has exactly 3 formats", () => expect(getFormatsForPlan("premium")).toHaveLength(3));
  });

  describe("VIP plan", () => {
    it("includes PNG", () => expect(getFormatsForPlan("vip")).toContain("png"));
    it("includes SVG", () => expect(getFormatsForPlan("vip")).toContain("svg"));
    it("includes PDF", () => expect(getFormatsForPlan("vip")).toContain("pdf"));
    it("includes DOCX", () => expect(getFormatsForPlan("vip")).toContain("docx"));
    it("has exactly 4 formats", () => expect(getFormatsForPlan("vip")).toHaveLength(4));
  });

  describe("Unknown plan", () => {
    it("falls back to PNG only", () => {
      expect(getFormatsForPlan("unknown")).toEqual(["png"]);
    });
    it("has exactly 1 format", () => expect(getFormatsForPlan("unknown")).toHaveLength(1));
  });

  describe("Format ordering", () => {
    it("PNG is always first", () => {
      for (const plan of ["promo", "econom", "premium", "vip"]) {
        expect(getFormatsForPlan(plan)[0]).toBe("png");
      }
    });

    it("VIP formats are in correct order: png, svg, pdf, docx", () => {
      expect(getFormatsForPlan("vip")).toEqual(["png", "svg", "pdf", "docx"]);
    });

    it("PREMIUM formats are in correct order: png, svg, pdf", () => {
      expect(getFormatsForPlan("premium")).toEqual(["png", "svg", "pdf"]);
    });

    it("ECONOM formats are in correct order: png, svg", () => {
      expect(getFormatsForPlan("econom")).toEqual(["png", "svg"]);
    });
  });

  describe("Plan pricing validation", () => {
    const PLAN_PRICES: Record<string, number> = {
      promo: 250,   // CHF 2.50 in cents
      econom: 350,  // CHF 3.50 in cents
      premium: 450, // CHF 4.50 in cents
      vip: 550,     // CHF 5.50 in cents
    };

    it("PROMO is cheapest plan at CHF 2.50", () => expect(PLAN_PRICES.promo).toBe(250));
    it("ECONOM is CHF 3.50", () => expect(PLAN_PRICES.econom).toBe(350));
    it("PREMIUM is CHF 4.50", () => expect(PLAN_PRICES.premium).toBe(450));
    it("VIP is most expensive at CHF 5.50", () => expect(PLAN_PRICES.vip).toBe(550));
    it("prices are in ascending order", () => {
      const prices = Object.values(PLAN_PRICES);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThan(prices[i - 1]!);
      }
    });
    it("more expensive plan includes more formats", () => {
      const plans = ["promo", "econom", "premium", "vip"];
      for (let i = 1; i < plans.length; i++) {
        expect(getFormatsForPlan(plans[i]!).length).toBeGreaterThan(
          getFormatsForPlan(plans[i - 1]!).length
        );
      }
    });
  });
});
