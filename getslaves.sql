SELECT 
		ms.id AS id, 
		ms.name AS name,
		g_display_reg_addr,
		g_display_reg_format,
		g_y_label,
		is_logging,
		CASE
			WHEN COUNT(dv.id) = 0 THEN '[]'
			ELSE '[' || GROUP_CONCAT(
				JSON_OBJECT(
					'name', dv.name,
					'reg_addr', dv.reg_addr,
					'reg_format', dv.reg_format
				), ', '
			) || ']' END AS display_values
		FROM modbus_slaves AS ms
		LEFT JOIN display_values AS dv ON dv.slave_id = ms.id
		GROUP BY ms.id, ms.name;