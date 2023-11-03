import express from "express";
import { modbusController } from "#root/controllers/index.js"
import { createDisplayValueSchema, displayValueSchema, modbusDeviceSchema, removeDisplayValueSchema, removeModbusDeviceSchema } from "#root/validators/index.js";
import { validateBodyMiddleware } from "#root/middlewares/index.js";

const modbusRouter = express.Router();

modbusRouter.get("/devices", modbusController.list);
modbusRouter.post("/create_device", validateBodyMiddleware(modbusDeviceSchema), modbusController.createDevice)
modbusRouter.post('/remove_device', validateBodyMiddleware(removeModbusDeviceSchema), modbusController.removeDevice);
modbusRouter.post('/update_device', validateBodyMiddleware(modbusDeviceSchema), modbusController.updateDevice);
modbusRouter.post('/create_display-value', validateBodyMiddleware(createDisplayValueSchema), modbusController.createDisplayValue);
modbusRouter.post('/remove_display-value', validateBodyMiddleware(removeDisplayValueSchema), modbusController.removeDisplayValue);
modbusRouter.post("/connect", modbusController.connect);
modbusRouter.post("/close", modbusController.close);
modbusRouter.get("/data_stream", modbusController.streamData);
modbusRouter.get('/status', modbusController.status);

export { modbusRouter }