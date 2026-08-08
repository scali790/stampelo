import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { templates, icons } from "../../drizzle/schema";
import { eq, like, and, or, sql, count, asc } from "drizzle-orm";
import { BUILT_IN_ICONS } from "../../shared/iconData";
import { TEMPLATE_RECORDS } from "../seed300Templates";

function toSourceTemplateRecord(template: typeof TEMPLATE_RECORDS[number]) {
  return {
    id: template.slug,
    slug: template.slug,
    category: template.category,
    name: template.name,
    nameDE: template.nameDE,
    shape: template.shape,
    searchTerms: template.searchTerms,
    stateJson: template.stateJson,
    thumbnailSvg: null,
    sortOrder: template.sortOrder,
  };
}

function listTemplatesFromSource(input: {
  category?: string;
  search?: string;
  shape?: string;
  page: number;
  pageSize: number;
}) {
  const normalizedSearch = input.search?.trim().toLowerCase();
  let items = TEMPLATE_RECORDS.filter((template) => {
    if (input.category && input.category !== "All" && template.category !== input.category) return false;
    if (input.shape && template.shape !== input.shape) return false;
    if (!normalizedSearch) return true;
    const haystack = [template.name, template.nameDE, template.searchTerms, template.category]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  items = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  const total = items.length;
  const offset = (input.page - 1) * input.pageSize;
  return {
    items: items.slice(offset, offset + input.pageSize).map(toSourceTemplateRecord),
    total,
    page: input.page,
    pageSize: input.pageSize,
    totalPages: Math.ceil(total / input.pageSize),
  };
}

export const templateRouter = router({
  list: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      search: z.string().optional(),
      shape: z.string().optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(24),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return listTemplatesFromSource(input);

      const conditions = [eq(templates.isActive, true)];

      if (input.category && input.category !== "All") {
        conditions.push(eq(templates.category, input.category));
      }

      if (input.shape) {
        conditions.push(eq(templates.shape as any, input.shape));
      }

      if (input.search && input.search.trim().length > 0) {
        const q = `%${input.search.trim()}%`;
        conditions.push(
          or(
            like(templates.name, q),
            like(templates.nameDE as any, q),
            like(templates.searchTerms as any, q),
            like(templates.category, q),
          )!
        );
      }

      const where = and(...conditions);
      const offset = (input.page - 1) * input.pageSize;

      const [items, totalResult] = await Promise.all([
        db.select().from(templates).where(where).orderBy(asc(templates.sortOrder)).limit(input.pageSize).offset(offset),
        db.select({ total: count() }).from(templates).where(where),
      ]);

      const total = totalResult[0]?.total ?? 0;

      return {
        items,
        total,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),

  categories: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      const counts = new Map<string, number>();
      for (const template of TEMPLATE_RECORDS) {
        counts.set(template.category, (counts.get(template.category) ?? 0) + 1);
      }
      return Array.from(counts.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([category, total]) => ({ category, count: total }));
    }
    // Return categories with counts for the filter sidebar
    const results = await db
      .select({ category: templates.category, count: count() })
      .from(templates)
      .where(eq(templates.isActive, true))
      .groupBy(templates.category)
      .orderBy(asc(templates.category));
    return results;
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        const template = TEMPLATE_RECORDS.find((entry) => entry.slug === input.slug);
        return template ? toSourceTemplateRecord(template) : null;
      }
      const [t] = await db.select().from(templates).where(eq(templates.slug as any, input.slug)).limit(1);
      return t ?? null;
    }),
});

export const iconRouter = router({
  list: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      // Return built-in icons (filtered)
      let icons = BUILT_IN_ICONS;
      if (input.category) {
        icons = icons.filter((i) => i.category === input.category);
      }
      if (input.search) {
        const q = input.search.toLowerCase();
        icons = icons.filter(
          (i) => i.name.toLowerCase().includes(q) || i.tags.toLowerCase().includes(q)
        );
      }
      return icons;
    }),

  categories: publicProcedure.query(() => {
    return Array.from(new Set(BUILT_IN_ICONS.map((i) => i.category)));
  }),
});
