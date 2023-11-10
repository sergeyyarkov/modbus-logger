import db from "#root/config/database.config.js";
import modbusClient from "#root/config/modbus-client.config.js";
import * as utils from '#root/utils/index.js'
import { RowNotFoundError } from '#root/errors/index.js'
import { appService, modbusService } from "#root/services/index.js";
import { modbusDeviceModel, displayValueModel } from "#root/models/index.js";

export const modbusController = {
  /**
   * Connect to modbus network using configuration from database
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async connect(req, res, next) {
    try {
      const appConfig = await appService.getConfig();
      if (!appConfig) return res.status(400).json({ message: "Application is not configured" });
      await modbusService.connect(appConfig);
      return res.status(200).json({ message: "Connected." });
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
      const devices = await modbusService.getDevices();
      return res.status(200).json(devices);
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
      await modbusDeviceModel.create({
        id: req.body.id,
        name: req.body.name,
        g_display_reg_addr: req.body.g_display_reg_addr,
        g_display_reg_format: req.body.g_display_reg_format,
        g_display_reg_type: req.body.g_display_reg_type,
        g_y_label: req.body.g_y_label
      })
      return res.status(200).json({ message: "Device created." });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update modbus slave device
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async updateDevice(req, res, next) {
    try {
      const { 
        id,
        newId,
        name, 
        g_display_reg_addr, 
        g_display_reg_type, 
        g_display_reg_format, 
        g_y_label 
      } = req.body;

      await db.run(`UPDATE "modbus_slaves" SET 
                    id = ?, 
                    name = ?,
                    g_display_reg_addr = ?,
                    g_display_reg_type = ?,
                    g_display_reg_format = ?,
                    g_y_label = ?
                    WHERE id = ? `, 
                    [newId, name, g_display_reg_addr, g_display_reg_type, g_display_reg_format, g_y_label, id]);
    
      return res.status(200).json({ message: 'Updated.' })
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
      const { id } = req.body;
      const device = await modbusDeviceModel.getById(id)
      if (!device) throw new RowNotFoundError();
      await modbusDeviceModel.delById(id);
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
  async createDisplayValue(req, res, next) {
    try {
      const { name, slave_id, reg_addr, reg_format, reg_type } = req.body
      await db.run(`INSERT INTO "display_values" 
                    ("name", "slave_id", "reg_addr", "reg_format", "reg_type") 
                    VALUES (?, ?, ?, ?, ?)
                  `, [name, slave_id, reg_addr, reg_format, reg_type]
                  );
      const createdDisplayValue = await db.get(`SELECT * FROM "display_values" WHERE id = last_insert_rowid()`);
      
      return res.status(200).json({ 
        message: 'Created.',
        data: createdDisplayValue,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Remove display value from modbus slave device
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async removeDisplayValue(req, res, next) {
    try {
      const { id } = req.body;
      const value = await displayValueModel.getById(id);
      if (!value) throw new RowNotFoundError();
      await displayValueModel.delById(id);
      return res.status(200).json({ message: "Display value removed." });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update display value
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async updateDisplayValue(req, res, next) {
    try {
      const { id, name, slave_id, reg_addr, reg_type, reg_format } = req.body;
      const row = await db.get(`SELECT id from "display_values" WHERE id = ?`, [id]);
      if (!row) throw new RowNotFoundError();
      await db.run(`UPDATE "display_values" SET
                    name = ?,
                    slave_id = ?,
                    reg_addr = ?,
                    reg_type = ?,
                    reg_format = ? 
                    WHERE id = ?`, [name, slave_id, reg_addr, reg_type, reg_format, id]);
      return res.status(200).json({ message: 'Updated.' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Creates event stream about modbus connection status
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async status(req, res, next) {
    try {
      utils.setSSEHeaders(res);
      const intervalId = modbusService.startConnectionStatusInterval((status) => res.write(utils.serializeSSEData(status, 'message')))
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
      const { slave_id } = req.query;
      if (!slave_id) return res.status(400).json({ error: { message: "'slave_id' parameter is required." } });

      const device = await modbusDeviceModel.getById(slave_id.toString());
      if (!device) throw new RowNotFoundError();

      utils.setSSEHeaders(res);

      const intervalId = await modbusService.startDevicePollInterval(
        device,
        (data, error) => {
          if (error) {
            res.write(utils.serializeSSEData({ error: { message: error.message }}, 'message'))
            return;
          }
          res.write(utils.serializeSSEData(data, 'message'));
        },
      );

      req.on("close", () => clearInterval(intervalId));
    } catch (error) {
      next(error);
    }
  },
};
