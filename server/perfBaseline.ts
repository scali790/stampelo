/**
 * Stampelo Performance Baseline
 * Tests: editor SVG render stress, template query speed, export pipeline timing
 */
import { renderStampSvg } from "../client/src/editor/svgUtils";
import { generatePng, generateSvg, generateEps, generatePdf, generateDocx } from "./exportService";
import { getDb } from "./db";
import { templates } from "../drizzle/schema";
import { eq } from "drizzle-orm";

type Stamp = Parameters<typeof renderStampSvg>[0];

function makeStressStamp(elementCount: number): Stamp {
  const elements: Stamp["elements"] = [];
  elements.push({ id: "frame", type: "frame", color: "#1a3a6b", visible: true, radius: 90, strokeWidth: 3, lineBreak: 0 });
  for (let i = 0; i < elementCount; i++) {
    if (i % 3 === 0) {
      elements.push({ id: `tp${i}`, type: "text-on-path", color: "#1a3a6b", visible: true, text: `TEXT ${i}`, font: "Arial", fontSize: 10, bold: false, italic: false, align: "center", inverse: false, radius: 80 - i * 0.5, letterSpacing: 2, startAngle: i * 10 });
    } else if (i % 3 === 1) {
      elements.push({ id: `ct${i}`, type: "center-text", color: "#1a3a6b", visible: true, text: `CENTER ${i}`, font: "Arial", fontSize: 8, bold: false, italic: false, x: 50, y: 50 });
    } else {
      elements.push({ id: `fr${i}`, type: "frame", color: "#1a3a6b", visible: true, radius: 70 - i * 0.3, strokeWidth: 1, lineBreak: 0 });
    }
  }
  return {
    id: "stress", shape: "round", widthMm: 38, heightMm: 38, color: "#1a3a6b",
    effects: { shabby: false, gold: false, silver: false },
    elements,
  };
}

async function bench(label: string, fn: () => Promise<void> | void, iterations = 1): Promise<number> {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    await fn();
  }
  const elapsed = (performance.now() - start) / iterations;
  const status = elapsed < 1000 ? "✅" : elapsed < 3000 ? "⚠️" : "❌";
  console.log(`  ${status} ${label}: ${elapsed.toFixed(1)}ms avg (${iterations} runs)`);
  return elapsed;
}

async function main() {
  console.log("=== Stampelo Performance Baseline ===\n");
  const results: Record<string, number> = {};

  // ── 1. SVG render stress ──────────────────────────────────────────────────
  console.log("1. SVG Render Stress (client-side renderer)");
  for (const count of [5, 20, 50, 100]) {
    const stamp = makeStressStamp(count);
    results[`svg_render_${count}_elements`] = await bench(`Render SVG with ${count} elements`, () => {
      renderStampSvg(stamp);
    }, 10);
  }

  // ── 2. Export pipeline timing ─────────────────────────────────────────────
  console.log("\n2. Export Pipeline Timing");
  const exportStamp = makeStressStamp(5);
  results["export_png_300dpi"] = await bench("PNG export (300 DPI)", async () => {
    await generatePng(exportStamp as any, 300);
  }, 3);
  results["export_svg"] = await bench("SVG export", () => {
    generateSvg(exportStamp as any);
  }, 10);
  results["export_eps"] = await bench("EPS export", () => {
    generateEps(exportStamp as any);
  }, 10);
  results["export_pdf"] = await bench("PDF export", async () => {
    await generatePdf(exportStamp as any);
  }, 3);
  results["export_docx"] = await bench("DOCX export", async () => {
    await generateDocx(exportStamp as any);
  }, 3);

  // ── 3. Template DB query timing ───────────────────────────────────────────
  console.log("\n3. Template Database Query Timing");
  const db = await getDb();
  if (db) {
    results["template_list_all"] = await bench("List all active templates (no filter)", async () => {
      await db.select().from(templates).where(eq(templates.isActive, true)).limit(24);
    }, 5);

    results["template_list_category"] = await bench("List templates by category (Business)", async () => {
      await db.select().from(templates).where(eq(templates.category, "Business")).limit(24);
    }, 5);

    results["template_count"] = await bench("Count all active templates", async () => {
      const { count } = await import("drizzle-orm");
      await db.select({ total: count() }).from(templates).where(eq(templates.isActive, true));
    }, 5);
  } else {
    console.log("  ⚠️ Database not available — skipping DB benchmarks");
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n=== Summary ===");
  const allPass = Object.entries(results).every(([k, v]) => {
    const threshold = k.startsWith("export_png") ? 5000 : k.startsWith("export_") ? 3000 : 500;
    return v < threshold;
  });
  console.log(`Overall: ${allPass ? "✅ ALL WITHIN THRESHOLDS" : "⚠️ SOME THRESHOLDS EXCEEDED"}`);
  console.log("\nThresholds: SVG render <500ms, PNG export <5000ms, other exports <3000ms, DB queries <500ms");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
