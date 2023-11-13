import db from "#root/config/database.config.js";
import cp from 'child_process'

/**
 * Services
 */
 import { appService } from "#root/services/index.js";

export const appController = {
    /**
     * Get application config from database
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     * @param {import('express').NextFunction} next 
     */
    async getConfig(req, res, next) {
        try {
            const data = await appService.getConfig();
            if (!data) return res.status(200).json({ config: null });
            return res.status(200).json({ config: data });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Update application config
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     * @param {import('express').NextFunction} next 
     */
    async updateConfig(req, res, next) {
        try {
            const config = await appService.getConfig();
            const payload = req.body;
        
            if (!config) await db.run(`INSERT INTO "app_config" (id) VALUES (?)`, [0]);
        
            /* Update TCP configuration */
            if (payload.mb_connection_type === "TCP") {
            const { mb_tcp_ip, mb_tcp_port } = payload;
            await db.run(
                `
                UPDATE "app_config" SET id = 0, mb_connection_type = "TCP", mb_tcp_ip = ?, mb_tcp_port = ?, log_interval_ms = ?
                `,
                [mb_tcp_ip, mb_tcp_port, payload.log_interval_ms],
            );
        
            return res.status(200).json({ message: "Config Updated." });
            }
        
            /* Update RTU configuration */
            if (payload.mb_connection_type === "RTU") {
            const { mb_rtu_path, mb_rtu_baud, mb_rtu_parity, mb_rtu_data_bits, mb_rtu_stop_bits } = payload;
            await db.run(
                `
                UPDATE "app_config" SET id = 0, 
                                        mb_connection_type = "RTU", 
                                        mb_rtu_path = ?, 
                                        mb_rtu_baud = ?, 
                                        mb_rtu_parity = ?, 
                                        mb_rtu_data_bits = ?, 
                                        mb_rtu_stop_bits = ?,
                                        log_interval_ms = ?
                `,
                [mb_rtu_path, mb_rtu_baud, mb_rtu_parity, mb_rtu_data_bits, mb_rtu_stop_bits, payload.log_interval_ms],
            );
            return res.status(200).json({ message: "Config updated." });
            }
        
            return res.status(400).json({ message: "Undefined Modbus connection type." });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Check whether the application is configured or not
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     * @param {import('express').NextFunction} next 
     */
    async isConfigured(req, res, next) {
        try {
            const config = await appService.getConfig();
            if (!config) return res.status(200).json({ is_configured: false });

            for (const colPrefix of ['mb_tcp', 'mb_rtu']) {
                if (config.mb_connection_type.toLocaleLowerCase() !== colPrefix.substring(3))
                    continue;
                const keys = Object.keys(config).filter((k) => k.includes(colPrefix));
                for (const k of keys) {
                    if (!config[k])
                        return res.status(200).json({ is_configured: false });
                }
            }
        
            return res.status(200).json({ is_configured: true });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Application memory usage
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     * @param {import('express').NextFunction} next 
     */
    memoryUsage(req, res, next) {
    	const memoryUsage = process.memoryUsage();
			const bytesToMB = (bytes) => bytes / 10**6;
			Object.keys(memoryUsage).forEach(k => (memoryUsage[k] = `${bytesToMB(memoryUsage[k])}MB`));
    	return res.status(200).json({ data: memoryUsage });
    },
		
		/**
     * Ping
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     * @param {import('express').NextFunction} next 
     */
		ping(req, res, next) {
			return res.status(200).send('pong');
		},

		/**
     * Send info about latest commit hash
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     * @param {import('express').NextFunction} next 
     */
		commitHash(req, res, next) {
			const hash = cp.execSync('git rev-parse HEAD').toString().trim();
  		return res.status(200).json({ hash })
		}
}