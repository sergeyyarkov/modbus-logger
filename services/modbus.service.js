import modbusClient from "#root/config/modbus-client.config.js";
import * as utils from '#root/utils/index.js'

export const modbusService = {
  /**
   * @param {import("..").ModbusDevice} device
   * @return {Promise<import("..").EventDataStream>}
   */
  async readDataFromDevice(device) {
    const { g_display_reg_format, g_display_reg_addr, g_display_reg_type } = device;
    
    /** @type {import("..").EventDataStream} */
    const data = { graph: null, displayValues: [] };

    modbusClient.setID(device.id);
    
    /* Read data for graph */
    if (g_display_reg_addr !== null) {
      const graphValue = await this.readModbusRegisters(g_display_reg_addr, g_display_reg_type, g_display_reg_format);
      data.graph = {
        value: utils.readNumberFromBuf(graphValue, device.g_display_reg_format, 'BE'),
        format: g_display_reg_format
      }
    }

    /* Read data for display values */
    if (device.display_values) {
      for (const value of device.display_values) {
        value.data = Buffer.from((await this.readModbusRegisters(value.reg_addr, 'HR', 'UI16'))).readUInt16BE();
      }
    }

    data.displayValues = device.display_values;

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
  
    if (format.includes('32')) len = 2;
    if (format.includes('64')) len = 4;
    if (format.includes('128')) len = 8;
  
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