export const appService = {
  /**
   * Get configuration of app
   * @param {import('sqlite').Database} db
   * @returns {Promise<import('../index').AppConfig | undefined>}
   */
  async getConfig(db) {
    const data = await db.get(`
          SELECT  "mb_connection_type",
                  "mb_tcp_ip",
                  "mb_tcp_port",
                  "mb_rtu_path",
                  "mb_rtu_baud",
                  "mb_rtu_parity",
                  "mb_rtu_data_bits",
                  "mb_rtu_stop_bits",
                  "log_interval_ms"
            FROM "app_config"
        `);
    return data;
  },
};
