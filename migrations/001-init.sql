--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "app_config" (
	"id"	INTEGER,
	"mb_connection_type"	VARCHAR(3) NOT NULL DEFAULT "RTU" CHECK(mb_connection_type IN ('TCP','RTU')),
	"mb_tcp_ip"	VARCHAR(15) NOT NULL DEFAULT "127.0.0.1",
	"mb_tcp_port"	INTEGER NOT NULL DEFAULT 502,
	"mb_rtu_path"	VARCHAR(10) NOT NULL DEFAULT "",
	"mb_rtu_baud"	INTEGER NOT NULL DEFAULT 9600,
	"mb_rtu_parity"	VARCHAR(5) NOT NULL DEFAULT "none" CHECK(mb_rtu_parity IN ("even", "odd", "none")),
	"mb_rtu_data_bits"	INTEGER NOT NULL DEFAULT 8,
	"mb_rtu_stop_bits"	INTEGER NOT NULL DEFAULT 1,
	"log_interval_ms" INTEGER DEFAULT 1000 NOT NULL,
	CONSTRAINT "id_unique" CHECK(id=0),
	CONSTRAINT "min_interval_check" CHECK(log_interval_ms >= 1000)
	PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "modbus_slaves" (
	"id" INTEGER CHECK (id >= 1 AND id <= 255),
	"name" VARCHAR(256) NOT NULL,
	"g_display_reg_addr" INTEGER CHECK(g_display_reg_addr >= 0 AND g_display_reg_addr <= 65534) DEFAULT NULL, 
	"g_display_reg_type" VARCHAR(3) CHECK(g_display_reg_type IN("HR", "IR")) DEFAULT "IR",
	"g_display_reg_format" VARCHAR(5) CHECK(g_display_reg_format IN("UI16", "I16", "UI32", "I32", "FP32")) DEFAULT "UI16",
	"g_y_label" VARCHAR(40) DEFAULT "Label",
	"is_logging" BOOLEAN NOT NULL DEFAULT FALSE,
	PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "display_values" (
	"id" INTEGER,
	"name" VARCHAR(32) NOT NULL,
	"slave_id" INTEGER NOT NULL,
	"reg_addr" INTEGER DEFAULT 0 NOT NULL CHECK(reg_addr >= 0 AND reg_addr <= 65534),
	"reg_type" VARCHAR(3) NOT NULL CHECK(reg_type IN("HR", "IR", "DI", "DO")) DEFAULT "IR",
	"reg_format" VARCHAR(5) NOT NULL CHECK(reg_format IN("UI16", "I16", "UI32", "I32", "FP32", "BOOL")) DEFAULT "UI16",
	PRIMARY KEY("id"),
	FOREIGN KEY("slave_id") REFERENCES modbus_slaves("id") ON DELETE CASCADE
);

-- CREATE TABLE IF NOT EXISTS "modbus_log" (
-- 	"id" INTEGER,
-- 	"date" DATE NOT NULL,
-- 	"slave_id" INTEGER NOT NULL,
	
-- 	-- JSON Format: 
-- 	-- {
-- 	-- 	graph: [{ reg_addr: 1 value: 4 }],
-- 	-- 	display_values: [{ ... }]
-- 	-- }
-- 	"data" TEXT NOT NULL,
-- 	PRIMARY KEY("id"),
-- 	FOREIGN KEY("slave_id") REFERENCES modbus_slaves("id") ON DELETE CASCADE
-- )

INSERT INTO "modbus_slaves" (
	"id", "name", "g_display_reg_addr", "g_display_reg_type", "g_display_reg_format", "g_y_label", "is_logging"
) VALUES
	(1, "Device #1", 0, "IR", "UI16", "Label 1", 1),
	(2, "Device #2", 1, "IR", "UI32", "Label 2", 1),
	(3, "Device #3", 3, "IR", "UI16", "Label 3", 0),
	(4, "Device #4", NULL, NULL, NULL, "Label 4", 0);

INSERT INTO "display_values" (
	"id", "name", "slave_id", "reg_addr", "reg_format", "reg_type"
) VALUES
	(1, "CV1", 1, 10, "UI16", "IR"),
	(2, "CV2", 1, 11, "I16", "IR"),
	(3, "SP", 1, 12, "UI32", "IR"),
	(4, "CV1", 2, 13, "I32", "IR"),
	(5, "CV2", 2, 14, "I16", "IR"),
	(6, "SP", 2, 15, "UI16", "IR"),
	(7, "CV1", 3, 16, "UI16", "HR"),
	(8, "CV2", 3, 17, "FP32", "HR"),
	(9, "SP", 3, 15, "UI16", "IR"),
	(10, "Control action type", 3, 0, "BOOL", "DI"),
	(11, "Status ALARM1", 3, 1, "BOOL", "DO"),
	(12, "Status ALARM2", 3, 2, "BOOL", "DO");
--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE app_config;
DROP TABLE modbus_slaves;
DROP TABLE display_values;