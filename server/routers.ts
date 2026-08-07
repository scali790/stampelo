import { designRouter } from "./routers/design";
import { orderRouter } from "./routers/order";
import { templateRouter, iconRouter } from "./routers/template";
import { pdfEditorRouter } from "./routers/pdfEditor";
import { adminRouter } from "./routers/admin";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
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
