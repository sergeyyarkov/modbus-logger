import modbusClient from "#root/config/modbus-client.config.js";
import * as utils from '#root/utils/index.js'

export const modbusService = {
  /**
   * @param {import("..").ModbusDevice} device
   * @param {"HR" | "IR"} type
   */
  async readDataFromDevice(device, type = 'HR') {
    const { g_display_reg_format: g_format, g_display_reg_addr: g_reg_addr } = device;
    let readLength = 1; // 16 bits default

    modbusClient.setID(device.id);

    if (g_format?.includes('32')) readLength = 2;
    if (g_format?.includes('64')) readLength = 4;
    if (g_format?.includes('128')) readLength = 8;
    
    let graphValue;
    if (type === 'HR') graphValue = await modbusClient.readHoldingRegisters(g_reg_addr, readLength);
    if (type === 'IR') graphValue = await modbusClient.readInputRegisters(g_reg_addr, readLength);

    if (device.display_values) {
      for (const value of device.display_values) {
        value.data = Buffer.from((await modbusClient.readHoldingRegisters(value.reg_addr, 1)).buffer).readUInt16BE();
      }      
    }

    const graph = (g_reg_addr !== null ?  {
        value: utils.readNumberFromBuf(graphValue.buffer, device.g_display_reg_format, 'BE'),
        format: g_format
      } : null);

    return {
      graph,
      displayValues: device.display_values
    }
  }
}