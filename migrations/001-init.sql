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
	"display_reg_addr" INTEGER CHECK(display_reg_addr >= 0 AND display_reg_addr <= 65534),
	"display_reg_format" INTEGER CHECK(display_reg_format IN(16, 32)),
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

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE app_config;
DROP TABLE modbus_slaves;
DROP TABLE display_values;