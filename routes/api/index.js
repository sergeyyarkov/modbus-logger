import express from "express";
import { modbusRouter } from './modbus.router.js'
import { appRouter } from "./app.router.js";


const apiRouter = express.Router();

apiRouter.use("/modbus", modbusRouter);
apiRouter.use('/app', appRouter)

export { apiRouter };
