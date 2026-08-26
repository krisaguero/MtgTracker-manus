import { createApiApp } from "../../server/_core/apiApp";

/**
 * Explicit tRPC catch-all. Keeping this under api/trpc makes the deployed
 * function route unambiguous for Vercel while Express handles the procedure.
 */
const app = createApiApp();

export default app;
