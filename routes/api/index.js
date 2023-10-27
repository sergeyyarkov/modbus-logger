import express from "express";
import { modbusRouter } from './modbus.router.js'
import { appConfigSchema } from "#root/validators/index.js";
import { appController } from "#root/controllers/index.js";
import { validateBodyMiddleware } from "#root/middlewares/index.js";

const apiRouter = express.Router();

apiRouter.use("/modbus", modbusRouter);
apiRouter.get("/app/config", appController.getConfig);
apiRouter.patch("/app/config", validateBodyMiddleware(appConfigSchema), appController.updateConfig);
apiRouter.get("/app/is_configured", appController.isConfigured);

export { apiRouter };
