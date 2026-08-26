import { createApiApp } from "../server/_core/apiApp";

/**
 * Vercel catch-all function for `/api/*` requests.
 * Express performs the final routing for tRPC, OAuth, storage, and other APIs.
 */
const app = createApiApp();

export default app;
