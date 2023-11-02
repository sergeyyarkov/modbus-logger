import modbusClient from "#root/config/modbus-client.config.js";
import db from "#root/config/database.config.js";
import * as utils from "#root/utils/index.js";

export const modbusService = {
  /**
   * @param {import("..").ModbusDevice} device
   * @return {Promise<import("..").EventDataStream>}
   */
  async readDataFromDevice(device) {
    const { g_display_reg_format, g_display_reg_addr, g_display_reg_type, display_values } = device;

    /** @type {import("..").EventDataStream} */
    const data = { graph: null, displayValues: [] };

    modbusClient.setID(device.id);

    /* Read data for graph */
    if (g_display_reg_addr !== null) {
      const graphValueBuf = await this.readModbusRegisters(
        g_display_reg_addr,
        g_display_reg_type,
        g_display_reg_format,
      );
      data.graph = {
        value: utils.readNumberFromBuf(graphValueBuf, device.g_display_reg_format, "BE"),
        format: g_display_reg_format,
      };
    }

    /* Read data for display values */
    if (display_values) {
      for (const v of device.display_values) {
        const displayValueBuf = await this.readModbusRegisters(v.reg_addr, v.reg_type, v.reg_format);
        v.data = utils.readNumberFromBuf(displayValueBuf, v.reg_format, "BE");
        data.displayValues.push(v);
      }
    }

    return data;
  },

  /**
   * @param {import("..").AppConfig} appConfig
   * @return {Promise<void>}
   */
  async connect(appConfig) {
    const {
      mb_connection_type,
      mb_tcp_ip,
      mb_tcp_port,
      mb_rtu_path,
      mb_rtu_baud,
      mb_rtu_data_bits,
      mb_rtu_parity,
      mb_rtu_stop_bits,
    } = appConfig;

    if (modbusClient.isOpen) {
      modbusClient.close(undefined);
      modbusClient.destroy(undefined);
    }

    switch (mb_connection_type) {
      case "TCP": {
        await modbusClient.connectTCP(mb_tcp_ip, { port: mb_tcp_port });
        break;
      }
      case "RTU": {
        await modbusClient.connectRTU(mb_rtu_path, {
          baudRate: mb_rtu_baud,
          dataBits: mb_rtu_data_bits,
          parity: mb_rtu_parity,
          stopBits: mb_rtu_stop_bits,
        });
        break;
      }
      default:
        throw new Error("Unsupported connection type!");
    }
  },

  /**
   * @param {number} addr
   * @param {"HR" | "IR" | "DI"} type
   * @param {import("..").NumberType} format
   * @return {Promise<Buffer>} buffer data
   */
  async readModbusRegisters(addr, type, format) {
    let data;
    let len = 1;

    switch (format) {
      case "UI32":
      case "I32":
      case "FP32":
        len = 2;
        break;
      default:
        break;
    }

    switch (type) {
      case "HR":
        data = await modbusClient.readHoldingRegisters(addr, len);
        break;
      case "IR":
        data = await modbusClient.readInputRegisters(addr, len);
        break;
      case "DI":
        data = await modbusClient.readDiscreteInputs(addr, len);
        break;
      default:
        throw new Error("Incorrect modbus register type!");
    }

    return data.buffer;
  },

  async getDevices() {
    /** @type {import("..").ModbusDevice[]}  */
    const devices = await db.all(`
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
    // @ts-ignore
    devices.forEach((s) => (s.display_values = JSON.parse(s.display_values)));
    return devices;
  },

  /**
   * @param {import("..").ModbusDevice} device
   * @param {(data: import("..").EventDataStream, error: any) => void} callback
   * @param {number} intervalMs
   */
  startDevicePollInterval(device, callback, intervalMs) {
    const poll = async () => {
      try {
        device.display_values = await db.all(`SELECT * FROM "display_values" WHERE slave_id = ?`, [device.id]);
        const data = await this.readDataFromDevice(device);
        callback(data);
      } catch (error) {
        callback(null, error);
      }
    };
    return setInterval(poll, intervalMs);
  },
};
