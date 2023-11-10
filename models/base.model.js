import db from '#root/config/database.config.js'

export class BaseModel {
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

  /**
   * @param {string[]} keys
   */
  async getList(keys = ['*']) {
    const query = `SELECT ${keys.join(',')} FROM ${this.table}`;
    const res = await db.all(query);
    return res;
  }

  /**
   * @param {{ [key: string]: any }} data 
   * @returns {Promise<any>} 
   */
  async create(data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const query = `
      INSERT INTO ${this.table} 
        (${fields.join(', ')}) 
        VALUES (${values.map(() => '?').join(',')})`;
    await db.run(query, values);
    return data;
  }
}