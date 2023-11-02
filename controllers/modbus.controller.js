import db from "#root/config/database.config.js";
import modbusClient from "#root/config/modbus-client.config.js";
import * as utils from '#root/utils/index.js'
import { appService, modbusService } from "#root/services/index.js";

export const modbusController = {
  /**
   * Connect to modbus network using configuration from database
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async connect(req, res, next) {
    try {
      const config = await appService.getConfig(db);
      if (!config) return res.status(400).json({ message: "Application is not configured" });

      if (modbusClient.isOpen) {
        modbusClient.close(undefined);
        modbusClient.destroy(undefined);
      }

      if (config.mb_connection_type === "TCP") {
        await modbusClient.connectTCP(config.mb_tcp_ip, { port: config.mb_tcp_port });
        return res.status(200).json({ message: "Connected." });
      }

      if (config.mb_connection_type === "RTU") {
        await modbusClient.connectRTU(config.mb_rtu_path, {
          baudRate: config.mb_rtu_baud,
          dataBits: config.mb_rtu_data_bits,
          parity: config.mb_rtu_parity,
          stopBits: config.mb_rtu_stop_bits,
        });
        return res.status(200).json({ message: "Connected." });
      }

      return res.status(400).json({ message: "Connection type is invalid." });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Close the modbus connection
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async close(req, res, next) {
    try {
      if (!modbusClient.isOpen) return res.status(400).json({ message: "Already closed." });
      modbusClient.close(undefined);
      modbusClient.destroy(undefined);
      return res.status(200).json({ message: "Closed." });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get list of modbus slave devices
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async list(req, res, next) {
    try {
      const slaves = await db.all(`
          SELECT  ms.id AS id, ms.name AS name, g_display_reg_addr, g_display_reg_format, g_display_reg_type, g_y_label, is_logging,
          CASE
            WHEN COUNT(dv.id) = 0 THEN '[]'
            ELSE '[' || GROUP_CONCAT(
              JSON_OBJECT(
                'id', dv.id,
                'name', dv.name,
                'reg_addr', dv.reg_addr,
                'reg_format', dv.reg_format,
                'reg_type', dv.reg_type
              ), ', '
            ) || ']' END AS display_values
          FROM modbus_slaves AS ms
          LEFT JOIN display_values AS dv ON dv.slave_id = ms.id
          GROUP BY ms.id, ms.name;
      `);
      slaves.forEach((s) => (s.display_values = JSON.parse(s.display_values)));
      return res.status(200).json(slaves);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create new modbus slave device
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async createDevice(req, res, next) {
    try {
      const { id, name, g_display_reg_addr, g_display_reg_format, g_display_reg_type, g_y_label, is_logging } = req.body;
      await db.run(
        `INSERT INTO "modbus_slaves" (
                    "id", 
                    "name", 
                    "g_display_reg_addr", 
                    "g_display_reg_format",
                    "g_display_reg_type",
                    "g_y_label", 
                    "is_logging") 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, name, g_display_reg_addr, g_display_reg_format, g_display_reg_type, g_y_label, is_logging],
      );
      return res.status(200).json({ message: "Device created." });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Remove modbus slave device
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async updateDevice(req, res, next) {
    try {
    } catch (error) {
      next(error);
    }
  },

  /**
   * Remove modbus slave device
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async removeDevice(req, res, next) {
    try {
      const device = await db.get(`SELECT id FROM "modbus_slaves" WHERE id = ?`, [req.body.id]);
      if (!device) return res.status(404).json({ message: "Device not found." });
      await db.run(`DELETE FROM "modbus_slaves" WHERE id = ?`, [req.body.id]);
      return res.status(200).json({ message: "Device removed." });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create display value for modbus slave device
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async createDisplayValue(req, res, next) {},

  /**
   * Remove display value from modbus slave device
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async removeDisplayValue(req, res, next) {
    try {
      await db.run(`DELETE FROM "display_values" WHERE id = ?`, req.body.id);
      return res.status(200).json({ message: "Display value removed." });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get latest data log from modbus slave device
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getLatestLog(req, res, next) {},

  /**
   * Creates event stream aboud modbus connection status
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async status(req, res, next) {
    try {
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Connection", "keep-alive");
      let intervalId = setInterval(() => {
        res.write(`event: message\ndata: ${JSON.stringify(modbusClient.isOpen)}\n\n`);
      }, 500);
      req.on("close", () => clearInterval(intervalId));
    } catch (error) {
      next(error);
    }
  },

  /**
   * Creates event stream for sending data from modbus device
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async streamData(req, res, next) {
    try {
      if (!modbusClient.isOpen) return res.status(503).json({ error: { message: "Modbus connection closed." } });
      
      const { slave_id } = req.query;
      
      if (!slave_id) 
        return res.status(400).json({ error: { message: "'slave_id' parameter is required." } });
      
      const device = await db.get(`SELECT * FROM "modbus_slaves" WHERE id = ?`, [slave_id]);
      
      if (!device) 
        return res.status(404).json({ error: { message: "Device not found." } });

      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Connection", "keep-alive");

      const streamInterval = setInterval(async () => {
        try {
          device.display_values = await db.all(`SELECT * FROM "display_values" WHERE slave_id = ?`, [slave_id]) 
          const data = await modbusService.readDataFromDevice(device);
          res.write("event: message\n");
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (error) {
          clearInterval(streamInterval);
          next(error);
        }
      }, 1000);

      req.on("close", () => clearInterval(streamInterval));
    } catch (error) {
      next(error);
    }
  },
};
