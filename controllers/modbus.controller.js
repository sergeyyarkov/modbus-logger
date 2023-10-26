import db from "#root/config/database.config.js";
import modbusClient from "#root/config/modbus-client.config.js";
import { appService } from "#root/services/index.js";

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
      const slaves = await db.all('SELECT * from modbus_slaves');
      return res.status(200).json(slaves);
    } catch (error) {
      next(error)
    }
  },

  /**
   * Create new modbus slave device
   * @param {import('express').Request} req 
   * @param {import('express').Response} res 
   * @param {import('express').NextFunction} next 
   */
  async createSlaveDevice(req, res, next) {},

  /**
   * Remove modbus slave device
   * @param {import('express').Request} req 
   * @param {import('express').Response} res 
   * @param {import('express').NextFunction} next 
   */
  async removeSlaveDevice(req, res, next) {
    try {
      const device = await db.get(`SELECT id FROM "modbus_slaves" WHERE id = ?`, [req.body.id]);
      if (!device) return res.status(404).json({ message: 'Device not found.' });
      await db.run(`DELETE FROM "modbus_slaves" WHERE id = ?`, [req.body.id]);
      return res.status(200).json({ message: 'Device removed.' });
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
  async removeDisplayValue(req, res, next) {},

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
      req.on('close', () => clearInterval(intervalId));
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
      if (!modbusClient.isOpen) return res.status(503).json({ message: "Modbus connection closed." });
  
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Connection", "keep-alive");
  
      let interval = setInterval(async () => {
        const { data } = await modbusClient.readHoldingRegisters(0, 1);
        res.write("event: messsage\n");
        res.write(`data: ${JSON.stringify({ data })}`);
        res.write("\n\n");
      }, 1000);
      req.on("close", () => clearInterval(interval));
    } catch (error) {
      next(error);
    }
  }
}