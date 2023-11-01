import express from "express";
import httpLogger from "#root/config/logger.config.js";

/**
 * Routers
 */
import { apiRouter } from "#root/routes/index.js";

/**
 * Middlewares
 */
import { errorHandlerMiddleware } from "#root/middlewares/index.js";

const app = express();

app.use(httpLogger);
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/api", apiRouter);
app.use(errorHandlerMiddleware());

export default app;
