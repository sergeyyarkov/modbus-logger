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
	-- Holding register
	"g_display_reg_addr" INTEGER CHECK(g_display_reg_addr >= 0 AND g_display_reg_addr <= 65534), 
	-- Use 1 or 2 bytes
	"g_display_reg_format" INTEGER CHECK(g_display_reg_format IN(16, 32)),
	"g_y_label" VARCHAR(40),
	"is_logging" BOOLEAN NOT NULL,
	PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "display_values" (
	"id" INTEGER,
	"name" VARCHAR(32),
	"slave_id" INTEGER NOT NULL,
	"reg_addr" INTEGER DEFAULT 0 NOT NULL CHECK(reg_addr >= 0 AND reg_addr <= 65534),
	PRIMARY KEY("id"),
	FOREIGN KEY("slave_id") REFERENCES modbus_slaves("id") ON DELETE CASCADE
);

INSERT INTO "modbus_slaves" (
	"id", "name", "g_display_reg_addr", "g_display_reg_format", "g_y_label", "is_logging"
) VALUES
	(1, "Device #1", 1, 16, "Label 1", 1),
	(2, "Device #2", 2, 32, "Label 2", 1),
	(3, "Device #3", 8, 16, "Label 3", 0),
	(4, "Device #4", NULL, NULL, "Label 4", 0);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE app_config;
DROP TABLE modbus_slaves;
DROP TABLE display_values;