import express from 'express'
import cp from 'child_process'
import { appConfigSchema } from "#root/validators/index.js";
import { appController } from "#root/controllers/index.js";
import { validateBodyMiddleware } from "#root/middlewares/index.js";

const appRouter = express.Router();

appRouter.get("/config", appController.getConfig);
appRouter.patch("/config", validateBodyMiddleware(appConfigSchema), appController.updateConfig);
appRouter.get("/is_configured", appController.isConfigured);
appRouter.get('/ping', (req, res) => res.status(200).send('pong'));
appRouter.get('/commit-hash', (req, res) => {
  const hash = cp.execSync('git rev-parse HEAD').toString().trim();
  return res.status(200).json({ hash })
})

export { appRouter }