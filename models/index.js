import db from '#root/config/database.config.js'

class BaseModel {
  /**
   * @param {string} table 
   */
  constructor(table) {
    this.table = table;
  }

  /**
   * @param {number | string} id
   * @param {string[]} keys
   * @return {Promise<any>}
   */
  async getById(id, keys = ['*']) {
    const query = `SELECT ${keys.join(',')} FROM ${this.table} WHERE id = ?`;
    const params = [id];
    const res = await db.get(query, params);
    return res;
  }

  /**
   * @param {number | string} id
   * @return {Promise<void>}
   */
  async delById(id) {
    const query = `DELETE FROM ${this.table} WHERE id = ?`;
    await db.run(query, [id]);
  }

  async getList(keys = ['*']) {
    const query = `SELECT ${keys.join(',')} FROM ${this.table}`;
    const res = await db.all(query);
    return res;
  }

  async create(fields, values) {
    const query = `
      INSERT INTO ${this.table} 
        (${fields.join(',')}) 
        VALUES (${values.map(() => '?').join(',')})`;
    await db.run(query, values);
    return this;
  }
}

class ModbusDeviceModel extends BaseModel {
  constructor(table) {
    super(table);
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

export const modbusDeviceModel = new ModbusDeviceModel('modbus_slaves');