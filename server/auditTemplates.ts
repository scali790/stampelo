import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import { templates } from "../drizzle/schema";
import { normalizeTemplateState } from "../shared/templateStateNormalization";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const db = drizzle(pool);

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

function exactFingerprint(stateJson: unknown) {
  return JSON.stringify(normalizeTemplateState(stateJson));
}

async function main() {
  const rows = await db.select().from(templates).where(eq(templates.isActive, true));
  const categories = new Map<string, number>();
  const shapes = new Map<string, number>();
  const layouts = new Map<string, string[]>();
  const exact = new Map<string, string[]>();

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
    if (!stamp) missingStamp++;
    if (stamp?.heightMm == null) missingHeightMm++;
    if (!row.thumbnailSvg) missingThumbnail++;

    const rawElements = Array.isArray(stamp?.elements) ? stamp.elements : [];
    if (rawElements.some((e: any) => e?.type === "textOnPath")) legacyTextOnPath++;
    if (rawElements.some((e: any) => e?.type === "centerText")) legacyCenterText++;

    const normalized = normalizeTemplateState(row.stateJson);
    const visibleText = normalized.stamps[0]?.elements.filter((e: any) =>
      e.visible !== false && (e.type === "center-text" || e.type === "text-on-path") && String(e.text ?? "").trim().length > 0
    ) ?? [];
    if (visibleText.length === 0) noVisibleText++;

    const layoutKey = layoutFingerprint(row.stateJson);
    layouts.set(layoutKey, [...(layouts.get(layoutKey) ?? []), row.name]);

    const exactKey = exactFingerprint(row.stateJson);
    exact.set(exactKey, [...(exact.get(exactKey) ?? []), row.name]);
  }

  const layoutClusters = [...layouts.values()].sort((a, b) => b.length - a.length);
  const exactDuplicates = [...exact.values()].filter(v => v.length > 1).sort((a, b) => b.length - a.length);

  console.log(JSON.stringify({
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
    categories: Object.fromEntries([...categories.entries()].sort((a, b) => b[1] - a[1])),
    shapes: Object.fromEntries([...shapes.entries()].sort((a, b) => b[1] - a[1])),
    distinctStructuralLayouts: layouts.size,
    largestStructuralLayoutClusters: layoutClusters.slice(0, 12).map(names => ({ count: names.length, examples: names.slice(0, 8) })),
    exactDuplicateGroups: exactDuplicates.length,
    exactDuplicateExamples: exactDuplicates.slice(0, 10).map(names => ({ count: names.length, examples: names.slice(0, 8) })),
  }, null, 2));

  await pool.end();
}

main().catch(async error => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
