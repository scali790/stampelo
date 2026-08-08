import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import { templates } from "../drizzle/schema";
import { normalizeTemplateState } from "../shared/templateStateNormalization";
import { RAW_TEMPLATE_RECORDS } from "./seed300Templates";

const apply = process.argv.includes("--apply");

async function main() {
  if (!process.env.DATABASE_URL) {
    const changes = RAW_TEMPLATE_RECORDS.filter((record) =>
      JSON.stringify(record.stateJson ?? null) !== JSON.stringify(normalizeTemplateState(record.stateJson))
    );
    console.log(`[Template repair] ${changes.length}/${RAW_TEMPLATE_RECORDS.length} source templates require canonical normalization.`);
    console.log("[Template repair] DATABASE_URL is not configured, so this run is source-only and dry-run only.");
    console.log(changes.slice(0, 20).map((change) => `- ${change.slug}: ${change.name}`).join("\n"));
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const db = drizzle(pool);
  const rows = await db.select().from(templates).where(eq(templates.isActive, true));
  const changes: Array<{ id: number; name: string; stateJson: unknown }> = [];

  for (const row of rows) {
    const before = JSON.stringify(row.stateJson ?? null);
    const normalized = normalizeTemplateState(row.stateJson);
    const after = JSON.stringify(normalized);
    if (before !== after) changes.push({ id: row.id, name: row.name, stateJson: normalized });
  }

  console.log(`[Template repair] ${changes.length}/${rows.length} active templates require canonical state normalization.`);

  if (!apply) {
    console.log("[Template repair] Dry run only. Re-run with --apply to update the database.");
    console.log(changes.slice(0, 20).map(change => `- ${change.id}: ${change.name}`).join("\n"));
    await pool.end();
    return;
  }

  for (const change of changes) {
    await db.update(templates).set({ stateJson: change.stateJson as any }).where(eq(templates.id, change.id));
  }

  console.log(`[Template repair] Updated ${changes.length} templates.`);
  await pool.end();
}

main().catch(async error => {
  console.error(error);
  process.exit(1);
});
