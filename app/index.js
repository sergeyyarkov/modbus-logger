import express from "express";
import pino from "pino-http";

/**
 * Routers
 */
import { apiRouter } from "#root/routes/api.router.js";

/**
 * Middlewares
 */
import { errorHandlerMiddleware } from "#root/middlewares/index.js";

const app = express();

app.use(
  pino(
    process.env.NODE_ENV === "development" && {
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      },
    },
  ),
);
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/api", apiRouter);
app.use(errorHandlerMiddleware());

export default app;
