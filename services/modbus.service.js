import modbusClient from "#root/config/modbus-client.config.js";
import * as utils from '#root/utils/index.js'

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
      const graphValueBuf = await this.readModbusRegisters(g_display_reg_addr, g_display_reg_type, g_display_reg_format);
      data.graph = {
        value: utils.readNumberFromBuf(graphValueBuf, device.g_display_reg_format, 'BE'),
        format: g_display_reg_format
      }
    }

    /* Read data for display values */
    if (display_values) {
      for (const v of device.display_values) {
        const displayValueBuf = await this.readModbusRegisters(v.reg_addr, v.reg_type, v.reg_format)
        v.data = utils.readNumberFromBuf(displayValueBuf, v.reg_format, 'BE')
        data.displayValues.push(v);
      }
    }

    return data;
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
      case 'UI32':
      case 'I32':
      case 'FP32':
        len = 2;
        break;
      default:
        break;
    }
  
    switch (type) {
      case 'HR':
        data = await modbusClient.readHoldingRegisters(addr, len);  
        break;
      case 'IR':
        data = await modbusClient.readInputRegisters(addr, len);
        break;
      case 'DI':
        data = await modbusClient.readDiscreteInputs(addr, len);
        break;
      default:
        throw new Error('Incorrect modbus register type!');
    }
  
    return data.buffer;
  }
}