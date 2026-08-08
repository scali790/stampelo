import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import { templates } from "../drizzle/schema";
import {
  auditTemplateStampGeometry,
  normalizeTemplateState,
  type TemplateGeometryIssueSummary,
} from "../shared/templateStateNormalization";
import { RAW_TEMPLATE_RECORDS } from "./seed300Templates";

const ACCEPTED_DESIGN_REVIEW_EXCEPTION_SLUGS = new Set([
  "leg-internal-legal",
  "leg-privileged-1",
  "per-thank-you-1",
]);

type TemplateRowLike = {
  id: number | string;
  name: string;
  category: string;
  shape: string | null;
  stateJson: unknown;
};

function hasIssues(issues: TemplateGeometryIssueSummary): boolean {
  return Object.values(issues).some(Boolean);
}

function emptyIssueSummary(): TemplateGeometryIssueSummary {
  return {
    arcTextOverflow: false,
    frameCollision: false,
    centerTextOverflow: false,
    arcTextTooCloseToFrame: false,
    arcTextOccupancyTooHigh: false,
    centerTextOccupancyTooHigh: false,
    insufficientVisualClearance: false,
    multiRingCollisionRisk: false,
    missingInvalidGeometry: false,
    unsupportedState: false,
  };
}

async function loadRows(): Promise<{ source: "database" | "seed"; rows: TemplateRowLike[] }> {
  if (!process.env.DATABASE_URL) {
    return {
      source: "seed",
      rows: RAW_TEMPLATE_RECORDS.map((record) => ({
        id: record.slug,
        name: record.name,
        category: record.category,
        shape: record.shape,
        stateJson: record.stateJson,
      })),
    };
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const db = drizzle(pool);
  try {
    const rows = await db.select().from(templates).where(eq(templates.isActive, true));
    return { source: "database", rows };
  } finally {
    await pool.end();
  }
}

async function main() {
  const { source, rows } = await loadRows();
  const categories = new Map<string, number>();
  const invalidByShape = { round: 0, oval: 0, rectangular: 0, triangular: 0, other: 0 };
  const repairedInvalidByShape = { round: 0, oval: 0, rectangular: 0, triangular: 0, other: 0 };
  const repairedUnexpectedInvalidByShape = { round: 0, oval: 0, rectangular: 0, triangular: 0, other: 0 };
  const acceptedDesignReviewExceptions: Array<{ id: number | string; name: string; category: string; shape: string | null }> = [];

  let valid = 0;
  let invalid = 0;
  let repairedStillInvalid = 0;
  let repairedAcceptedExceptionCount = 0;
  let repairedUnexpectedInvalidCount = 0;

  const { rawReasonCounts, repairedReasonCounts, repairedUnexpectedReasonCounts } = rows.reduce((acc, row) => {
    categories.set(row.category, (categories.get(row.category) ?? 0) + 1);

    const stamp = normalizeTemplateState(row.stateJson, { repairGeometry: false }).stamps[0];
    const repairedStamp = normalizeTemplateState(row.stateJson, { repairGeometry: true }).stamps[0];
    const issues = stamp ? auditTemplateStampGeometry(stamp) : { ...emptyIssueSummary(), unsupportedState: true };
    const repairedIssues = repairedStamp ? auditTemplateStampGeometry(repairedStamp) : { ...emptyIssueSummary(), unsupportedState: true };

    if (hasIssues(issues)) {
      invalid++;
      const shape = stamp?.shape ?? row.shape;
      if (shape === "round" || shape === "oval" || shape === "rectangular" || shape === "triangular") {
        invalidByShape[shape]++;
      } else {
        invalidByShape.other++;
      }
    } else {
      valid++;
    }

    if (hasIssues(repairedIssues)) {
      repairedStillInvalid++;
      const repairedShape = repairedStamp?.shape ?? row.shape;
      const isAcceptedException =
        typeof row.id === "string" && ACCEPTED_DESIGN_REVIEW_EXCEPTION_SLUGS.has(row.id);
      if (
        repairedShape === "round" ||
        repairedShape === "oval" ||
        repairedShape === "rectangular" ||
        repairedShape === "triangular"
      ) {
        repairedInvalidByShape[repairedShape]++;
      } else {
        repairedInvalidByShape.other++;
      }

      if (isAcceptedException) {
        repairedAcceptedExceptionCount++;
        acceptedDesignReviewExceptions.push({
          id: row.id,
          name: row.name,
          category: row.category,
          shape: row.shape,
        });
      } else {
        repairedUnexpectedInvalidCount++;
        if (
          repairedShape === "round" ||
          repairedShape === "oval" ||
          repairedShape === "rectangular" ||
          repairedShape === "triangular"
        ) {
          repairedUnexpectedInvalidByShape[repairedShape]++;
        } else {
          repairedUnexpectedInvalidByShape.other++;
        }
      }
    }

    for (const [reason, present] of Object.entries(issues)) {
      if (present) acc.rawReasonCounts[reason as keyof TemplateGeometryIssueSummary]++;
    }
    for (const [reason, present] of Object.entries(repairedIssues)) {
      if (present) {
        acc.repairedReasonCounts[reason as keyof TemplateGeometryIssueSummary]++;
        const isAcceptedException =
          typeof row.id === "string" && ACCEPTED_DESIGN_REVIEW_EXCEPTION_SLUGS.has(row.id);
        if (!isAcceptedException) {
          acc.repairedUnexpectedReasonCounts[reason as keyof TemplateGeometryIssueSummary]++;
        }
      }
    }
    return acc;
  }, {
    rawReasonCounts: {
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
    },
    repairedReasonCounts: {
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
    },
    repairedUnexpectedReasonCounts: {
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
    },
  });

  console.log(JSON.stringify({
    auditedSource: source,
    totalTemplates: rows.length,
    valid,
    invalid,
    invalidByShape,
    invalidByReason: rawReasonCounts,
    categories: Object.fromEntries(Array.from(categories.entries()).sort((a, b) => a[0].localeCompare(b[0]))),
    repairedStillInvalid,
    repairedInvalidByShape,
    repairedInvalidByReason: repairedReasonCounts,
    repairedAcceptedExceptionCount,
    acceptedDesignReviewExceptions,
    repairedUnexpectedInvalidCount,
    repairedUnexpectedInvalidByShape,
    repairedUnexpectedInvalidByReason: repairedUnexpectedReasonCounts,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
