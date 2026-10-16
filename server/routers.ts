import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { systemRouter } from "./_core/systemRouter.js";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc.js";
import { marketRouter } from "./routers/market.js";
import * as db from "./db.js";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      (ctx.res as any).clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  market: marketRouter,
  account: router({
    savedDecks: protectedProcedure.query(({ ctx }) => db.listSavedDecks(ctx.user.id)),
    saveDeck: protectedProcedure.input(z.object({ deckKey: z.string().min(1).max(160), name: z.string().min(1).max(255), source: z.string().min(1).max(64).default('commander-precon'), deckJson: z.string().min(2).max(200000) })).mutation(({ ctx, input }) => db.upsertSavedDeck({ userId: ctx.user.id, ...input }).then(() => ({ success: true }))),
    deleteDeck: protectedProcedure.input(z.object({ deckKey: z.string().min(1).max(160) })).mutation(({ ctx, input }) => db.deleteSavedDeck(ctx.user.id, input.deckKey).then(() => ({ success: true }))),
  }),
});

export type AppRouter = typeof appRouter;
