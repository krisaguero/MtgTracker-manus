import express, { type Express } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";

/**
 * API-only Express application shared by local development and Vercel Functions.
 * This module intentionally does not import the Vite/static server bootstrap.
 */
export function createApiApp(): Express {
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  const trpcMiddleware = createExpressMiddleware({
    router: appRouter,
    createContext,
  });

  // Vercel can pass the function-relative path without the `/api` prefix.
  // Supporting both forms keeps local Express and nested Vercel functions aligned.
  app.use(["/api/trpc", "/trpc"], trpcMiddleware);

  return app;
}
