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
	CONSTRAINT "min_interval_check" CHECK(log_interval_ms >= 500)
	PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "modbus_slaves" (
	"id" INTEGER CHECK (id >= 1 AND id <= 255),
	"name" VARCHAR(256) NOT NULL,
	"g_display_reg_addr" INTEGER CHECK(g_display_reg_addr >= 0 AND g_display_reg_addr <= 65534) DEFAULT NULL, 
	"g_display_reg_type" VARCHAR(3) CHECK(g_display_reg_type IN("HR", "IR")) DEFAULT "IR",
	"g_display_reg_format" VARCHAR(5) CHECK(g_display_reg_format IN("UI16", "I16", "UI32", "I32", "FP32")) DEFAULT "UI16",
	"g_y_label" VARCHAR(40) DEFAULT "Label",
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
	FOREIGN KEY("slave_id") REFERENCES modbus_slaves("id") ON DELETE CASCADE ON UPDATE CASCADE
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
	"id", "name", "g_display_reg_addr", "g_display_reg_type", "g_display_reg_format", "g_y_label"
) VALUES
	(1, "MKP #1", 132, "HR", "UI16", "PID Out"),
	(2, "Test Device #1", 1, "IR", "UI32", "Label 2"),
	(3, "Test Device #2", 3, "IR", "UI16", "Label 3"),
	(4, "Test Device #3", NULL, NULL, NULL, "Label 4");

INSERT INTO "display_values" (
	"id", "name", "slave_id", "reg_addr", "reg_format", "reg_type"
) VALUES
	(1, "SP", 1, 138, "UI32", "HR"),
	(2, "Status Device", 1, 89, "UI16", "HR"),
	(3, "Control action type", 1, 2301, "BOOL", "DI"),
	(4, "S.L.Bd", 1, 528, "UI16", "HR"),
	(5, "VAL1", 2, 0, "I32", "IR"),
	(6, "VAL2", 2, 2, "I16", "IR"),
	(7, "VAL3", 2, 3, "UI16", "IR"),
	(8, "VAL4", 3, 4, "UI16", "HR"),
	(9, "VAL5", 3, 5, "FP32", "HR"),
	(10, "VAL6", 3, 7, "UI16", "IR"),
	(11, "VAL7", 3, 0, "BOOL", "DI"),
	(12, "VAL8", 3, 1, "BOOL", "DO"),
	(13, "VAL9", 3, 2, "BOOL", "DO");
--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE app_config;
DROP TABLE modbus_slaves;
DROP TABLE display_values;