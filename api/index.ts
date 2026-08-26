import { createApiApp } from "../server/_core/apiApp.js";

/**
 * Vercel invokes this exported Express application for `/api` requests.
 * The shared factory keeps local and serverless route registration consistent.
 */
const app = createApiApp();

export default app;
