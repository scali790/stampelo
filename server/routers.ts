import { designRouter } from "./routers/design";
import { orderRouter } from "./routers/order";
import { templateRouter, iconRouter } from "./routers/template";
import { pdfEditorRouter } from "./routers/pdfEditor";
import { adminRouter } from "./routers/admin";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: protectedProcedure.mutation(() => {
      // Session destruction is handled by Auth.js at /api/auth/signout.
      // This tRPC mutation exists so the client can invalidate the me query.
      return { success: true } as const;
    }),
  }),

  design: designRouter,
  order: orderRouter,
  template: templateRouter,
  icon: iconRouter,
  pdfEditor: pdfEditorRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
