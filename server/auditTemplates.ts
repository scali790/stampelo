import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import { templates } from "../drizzle/schema";
import { normalizeTemplateState } from "../shared/templateStateNormalization";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const db = drizzle(pool);
const includeDetails = process.argv.includes("--details");

const GENERIC_TEXT_PATTERNS = [
  /^YOUR\b/i,
  /^COMPANY\b/i,
  /^BUSINESS\b/i,
  /^NAME:?$/i,
  /^DATE:?$/i,
  /^DEPARTMENT\b/i,
  /^LOCATION$/i,
  /^STREET ADDRESS$/i,
  /^ADDRESS( LINE \d+)?$/i,
  /^CITY(?: · COUNTRY| · POSTCODE)?$/i,
  /^REFERENCE( NO\.)?$/i,
  /^LINE (ONE|TWO|THREE)$/i,
  /^SUBTITLE$/i,
  /^TITLE$/i,
];

function visibleTextValues(stateJson: unknown) {
  const state = normalizeTemplateState(stateJson);
  return (state.stamps[0]?.elements ?? [])
    .filter((element: any) =>
      element.visible !== false &&
      (element.type === "center-text" || element.type === "text-on-path") &&
      String(element.text ?? "").trim().length > 0
    )
    .map((element: any) => String(element.text).trim());
}

function layoutFingerprint(stateJson: unknown) {
  const state = normalizeTemplateState(stateJson);
  const stamp = state.stamps[0];
  if (!stamp) return "missing-stamp";

  return JSON.stringify({
    shape: stamp.shape,
    widthMm: stamp.widthMm,
    heightMm: stamp.heightMm,
    elements: stamp.elements.map((el: any) => ({
      type: el.type,
      radius: el.radius,
      strokeWidth: el.strokeWidth,
      font: el.font,
      fontSize: el.fontSize,
      bold: el.bold,
      italic: el.italic,
      align: el.align,
      inverse: el.inverse,
      letterSpacing: el.letterSpacing,
      startAngle: el.startAngle,
      x: el.x,
      y: el.y,
      scale: el.scale,
      lineBreak: el.lineBreak,
    })),
  });
}

function semanticFingerprint(stateJson: unknown) {
  const state = normalizeTemplateState(stateJson);
  const stamp = state.stamps[0];
  if (!stamp) return "missing-stamp";
  return JSON.stringify({
    shape: stamp.shape,
    text: visibleTextValues(stateJson).map(value => value.toUpperCase().replace(/\s+/g, " ")),
  });
}

function exactFingerprint(stateJson: unknown) {
  return JSON.stringify(normalizeTemplateState(stateJson));
}

function isGenericPlaceholder(text: string) {
  return GENERIC_TEXT_PATTERNS.some(pattern => pattern.test(text.trim()));
}

type AuditRecord = {
  id: number;
  slug: string | null;
  name: string;
  category: string;
  shape: string;
  layoutKey: string;
  visibleText: string[];
  genericTextCount: number;
  missingStamp: boolean;
};

async function main() {
  const rows = await db.select().from(templates).where(eq(templates.isActive, true));
  const categories = new Map<string, number>();
  const shapes = new Map<string, number>();
  const layouts = new Map<string, string[]>();
  const semantic = new Map<string, string[]>();
  const exact = new Map<string, string[]>();
  const records: AuditRecord[] = [];

  let legacyTextOnPath = 0;
  let legacyCenterText = 0;
  let missingHeightMm = 0;
  let missingThumbnail = 0;
  let missingStamp = 0;
  let noVisibleText = 0;

  for (const row of rows) {
    categories.set(row.category, (categories.get(row.category) ?? 0) + 1);
    shapes.set(row.shape ?? "unknown", (shapes.get(row.shape ?? "unknown") ?? 0) + 1);

    const raw = (row.stateJson ?? {}) as any;
    const stamp = raw?.stamps?.[0];
    const rowMissingStamp = !stamp;
    if (rowMissingStamp) missingStamp++;
    if (stamp?.heightMm == null) missingHeightMm++;
    if (!row.thumbnailSvg) missingThumbnail++;

    const rawElements = Array.isArray(stamp?.elements) ? stamp.elements : [];
    if (rawElements.some((e: any) => e?.type === "textOnPath")) legacyTextOnPath++;
    if (rawElements.some((e: any) => e?.type === "centerText")) legacyCenterText++;

    const visibleText = visibleTextValues(row.stateJson);
    if (visibleText.length === 0) noVisibleText++;

    const layoutKey = layoutFingerprint(row.stateJson);
    layouts.set(layoutKey, [...(layouts.get(layoutKey) ?? []), row.name]);

    const semanticKey = semanticFingerprint(row.stateJson);
    semantic.set(semanticKey, [...(semantic.get(semanticKey) ?? []), row.name]);

    const exactKey = exactFingerprint(row.stateJson);
    exact.set(exactKey, [...(exact.get(exactKey) ?? []), row.name]);

    records.push({
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: row.category,
      shape: row.shape ?? "unknown",
      layoutKey,
      visibleText,
      genericTextCount: visibleText.filter(isGenericPlaceholder).length,
      missingStamp: rowMissingStamp,
    });
  }

  const layoutClusters = Array.from(layouts.values()).sort((a, b) => b.length - a.length);
  const semanticDuplicates = Array.from(semantic.values()).filter(v => v.length > 1).sort((a, b) => b.length - a.length);
  const exactDuplicates = Array.from(exact.values()).filter(v => v.length > 1).sort((a, b) => b.length - a.length);

  // Automated classification is intentionally conservative. It is a review queue,
  // not a substitute for visual QA. Large layout families are B-candidates even
  // when their text differs because they still need a human distinctness review.
  const qualityDetails = records.map(record => {
    const structuralClusterSize = layouts.get(record.layoutKey)?.length ?? 1;
    const genericTextRatio = record.visibleText.length > 0
      ? record.genericTextCount / record.visibleText.length
      : 1;

    let classification: "A" | "B" | "C" = "A";
    const reasons: string[] = [];

    if (record.missingStamp || record.visibleText.length === 0) {
      classification = "C";
      reasons.push(record.missingStamp ? "missing stamp state" : "no visible text");
    } else if (structuralClusterSize >= 8 || genericTextRatio >= 0.5) {
      classification = "B";
      if (structuralClusterSize >= 8) reasons.push(`repeated structural layout (${structuralClusterSize} templates)`);
      if (genericTextRatio >= 0.5) reasons.push("placeholder-heavy content");
    }

    return {
      id: record.id,
      slug: record.slug,
      name: record.name,
      category: record.category,
      shape: record.shape,
      classification,
      reasons,
      structuralClusterSize,
      visibleText: record.visibleText,
    };
  });

  const qualityCounts = qualityDetails.reduce((acc, item) => {
    acc[item.classification]++;
    return acc;
  }, { A: 0, B: 0, C: 0 });

  const summary: Record<string, unknown> = {
    activeTemplates: rows.length,
    schemaIssues: {
      legacyTextOnPath,
      legacyCenterText,
      missingHeightMm,
      missingThumbnail,
      missingStamp,
      noVisibleText,
    },
    categoryCount: categories.size,
    categories: Object.fromEntries(Array.from(categories.entries()).sort((a, b) => b[1] - a[1])),
    shapes: Object.fromEntries(Array.from(shapes.entries()).sort((a, b) => b[1] - a[1])),
    structuralDiversity: {
      distinctStructuralLayouts: layouts.size,
      diversityRatio: Number((layouts.size / Math.max(rows.length, 1)).toFixed(3)),
      largestClusters: layoutClusters.slice(0, 12).map(names => ({ count: names.length, examples: names.slice(0, 8) })),
    },
    duplicateSignals: {
      exactDuplicateGroups: exactDuplicates.length,
      exactDuplicateExamples: exactDuplicates.slice(0, 10).map(names => ({ count: names.length, examples: names.slice(0, 8) })),
      sameShapeAndTextGroups: semanticDuplicates.length,
      sameShapeAndTextExamples: semanticDuplicates.slice(0, 10).map(names => ({ count: names.length, examples: names.slice(0, 8) })),
    },
    provisionalQualityClassification: {
      warning: "Automated A/B/C classification is a review queue. Final A/B/C status requires rendered visual inspection.",
      criteria: {
        A: "Structurally valid, visible text, not in a large repeated layout family, not placeholder-heavy.",
        B: "Structurally valid but belongs to a layout family of 8+ templates and/or is placeholder-heavy; requires redesign/distinctness review.",
        C: "Missing stamp state or no visible text; candidate for removal unless intentionally blank.",
      },
      counts: qualityCounts,
      examples: {
        A: qualityDetails.filter(item => item.classification === "A").slice(0, 12),
        B: qualityDetails.filter(item => item.classification === "B").slice(0, 12),
        C: qualityDetails.filter(item => item.classification === "C").slice(0, 12),
      },
    },
  };

  if (includeDetails) {
    summary.qualityDetails = qualityDetails;
  }

  console.log(JSON.stringify(summary, null, 2));
  await pool.end();
}

main().catch(async error => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
