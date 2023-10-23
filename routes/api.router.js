import express from "express";
import db from "#root/config/database.config.js";
import modbusClient from "#root/config/modbus-client.config.js";

/**
 * Validators
 */
import { appConfigSchema } from "#root/validators/index.js";

/**
 * Services
 */
import { appService } from "#root/services/index.js";

/**
 * Middlewares
 */
import { validateBodyMiddleware } from "#root/middlewares/index.js";

const apiRouter = express.Router();

/**
 * Get application config
 */
apiRouter.get("/app/config", async (req, res, next) => {
  try {
    const data = await appService.getConfig(db);
    if (!data) return res.status(404).json({ config: null });
    return res.status(200).json({ config: data });
  } catch (error) {
    next(error);
  }
});

/**
 * Update app configuration
 */
apiRouter.patch("/app/config", validateBodyMiddleware(appConfigSchema), async (req, res, next) => {
  try {
    const config = await appService.getConfig(db);
    const payload = req.body;

    if (!config) await db.run(`INSERT INTO "app_config" (id) VALUES (?)`, [0]);

    /* Update TCP configuration */
    if (payload.mb_connection_type === "TCP") {
      const { mb_tcp_ip, mb_tcp_port } = payload;
      await db.run(
        `
        UPDATE "app_config" SET id = 0, mb_connection_type = "TCP", mb_tcp_ip = ?, mb_tcp_port = ?, log_interval_ms = ?
        `,
        [mb_tcp_ip, mb_tcp_port, payload.log_interval_ms],
      );

      return res.status(200).send("Updated");
    }

    /* Update RTU configuration */
    if (payload.mb_connection_type === "RTU") {
      const { mb_rtu_path, mb_rtu_baud, mb_rtu_parity, mb_rtu_data_bits, mb_rtu_stop_bits } = payload;
      await db.run(
        `
        UPDATE "app_config" SET id = 0, 
                                mb_connection_type = "RTU", 
                                mb_rtu_path = ?, 
                                mb_rtu_baud = ?, 
                                mb_rtu_parity = ?, 
                                mb_rtu_data_bits = ?, 
                                mb_rtu_stop_bits = ?,
                                log_interval_ms = ?
        `,
        [mb_rtu_path, mb_rtu_baud, mb_rtu_parity, mb_rtu_data_bits, mb_rtu_stop_bits, payload.log_interval_ms],
      );
      return res.status(200).send("Updated.");
    }

    return res.status(400).send("Undefined Modbus connection type.");
  } catch (error) {
    next(error);
  }
});

/**
 * Check whether the application is configured or not
 */
apiRouter.get("/app/is_configured", async (req, res, next) => {
  try {
    const config = await appService.getConfig(db);
    let is_configured = false;

    if (!config) return res.status(200).send({ is_configured });

    const isValuesExists = (colPrefix) => {
      const keys = Object.keys(config).filter((k) => k.includes(colPrefix));
      for (const k of keys) if (!config[k]) return false;
      return true;
    };

    if (config.mb_connection_type === "TCP") is_configured = isValuesExists("mb_tcp");
    if (config.mb_connection_type === "RTU") is_configured = isValuesExists("mb_rtu");

    return res.status(200).send({ is_configured });
  } catch (error) {
    next(error);
  }
});

/**
 * Connect to modbus network using configuration from database
 */
apiRouter.post("/modbus/connect", async (req, res, next) => {
  try {
    const config = await appService.getConfig(db);
    if (!config) return res.status(400).send("Application is not configured");

    if (modbusClient.isOpen) {
      modbusClient.close(undefined);
      modbusClient.destroy(undefined);
    }

    if (config.mb_connection_type === "TCP") {
      await modbusClient.connectTCP(config.mb_tcp_ip, { port: config.mb_tcp_port });
      return res.status(200).send("Connected.");
    }

    if (config.mb_connection_type === "RTU") {
      await modbusClient.connectRTU(config.mb_rtu_path, {
        baudRate: config.mb_rtu_baud,
        dataBits: config.mb_rtu_data_bits,
        parity: config.mb_rtu_parity,
        stopBits: config.mb_rtu_stop_bits,
      });
      return res.status(200).send("Connected.");
    }

    return res.status(400).send("Connection type is invalid.");
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/modbus/close", (req, res, next) => {
  try {
    if (!modbusClient.isOpen) return res.status(400).send("Already closed.");
    modbusClient.close(undefined);
    modbusClient.destroy(undefined);
  } catch (error) {
    next(error);
  }
});

export { apiRouter };
