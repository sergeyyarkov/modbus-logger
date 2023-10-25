import express from "express";
import modbusClient from "#root/config/modbus-client.config.js";

/**
 * Validators
 */
import { appConfigSchema } from "#root/validators/index.js";

/**
 * Controllers
 */
import { appController, modbusController } from '#root/controllers/index.js'

/**
 * Middlewares
 */
import { validateBodyMiddleware } from "#root/middlewares/index.js";

const apiRouter = express.Router();

apiRouter.get("/app/config", appController.getConfig);
apiRouter.patch("/app/config", validateBodyMiddleware(appConfigSchema), appController.updateConfig);
apiRouter.get("/app/is_configured", appController.isConfigured);

apiRouter.get('/modbus/devices', modbusController.list);
apiRouter.post("/modbus/connect", modbusController.connect);
apiRouter.post("/modbus/close", modbusController.close);
apiRouter.get("/modbus/data_stream", modbusController.streamData);

export { apiRouter };
