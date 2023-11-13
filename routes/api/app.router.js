import express from 'express'
import { appConfigSchema } from "#root/validators/index.js";
import { appController } from "#root/controllers/index.js";
import { validateBodyMiddleware } from "#root/middlewares/index.js";

const appRouter = express.Router();

appRouter.get("/config", appController.getConfig);
appRouter.patch("/config", validateBodyMiddleware(appConfigSchema), appController.updateConfig);
appRouter.get("/is_configured", appController.isConfigured);
appRouter.get('/ping', appController.ping);
appRouter.get('/commit-hash', appController.commitHash)
appRouter.get('/memory', appController.memoryUsage)

export { appRouter }