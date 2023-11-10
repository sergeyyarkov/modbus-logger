import { BaseModel } from './base.model.js'
import db from '#root/config/database.config.js'

export class ModbusDeviceModel extends BaseModel {
  constructor() {
    super('modbus_slaves');
  }

  /**
   * @return {Promise<import('..').ModbusDevice[]>}
   */
  async getListWithDisplayValues() {
    const query = `
      SELECT  ms.id AS id, ms.name AS name, g_display_reg_addr, g_display_reg_format, g_display_reg_type, g_y_label,
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
        FROM ${this.table} AS ms
        LEFT JOIN display_values AS dv ON dv.slave_id = ms.id
        GROUP BY ms.id, ms.name;`;
    const devices = await db.all(query);
    devices.forEach((s) => (s.display_values = JSON.parse(s.display_values)));
    return devices;
  }
}