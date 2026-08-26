import { createApiApp } from "../server/_core/index";

/**
 * Vercel invokes this exported Express application for every `/api/*` request.
 * The shared factory keeps local and serverless route registration consistent.
 */
const app = createApiApp();

export default app;
