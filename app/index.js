import express from "express";
import pino from "pino-http";

/**
 * Routers
 */
import { apiRouter } from "../routes/api.router.js";

const app = express();

app.use(pino());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/api", apiRouter);

export default app;
