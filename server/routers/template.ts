import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { templates, icons } from "../../drizzle/schema";
import { eq, like, and } from "drizzle-orm";
import { BUILT_IN_ICONS } from "../../shared/iconData";

export const templateRouter = router({
  list: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      let query = db.select().from(templates);
      // Return all active templates, filtering handled client-side for simplicity
      const results = await db.select().from(templates).where(eq(templates.isActive, true));
      return results;
    }),

  categories: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const results = await db.select({ category: templates.category }).from(templates);
    const cats = results.map((r) => r.category);
    return Array.from(new Set(cats));
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
