CREATE TABLE IF NOT EXISTS "app_config" (
	"id"	INTEGER,
	"mb_connection_type"	VARCHAR(3) NOT NULL DEFAULT "RTU" CHECK(mb_connection_type IN ('TCP','RTU')),
	"mb_tcp_ip"	VARCHAR(15),
	"mb_tcp_port"	INTEGER,
	"mb_rtu_path"	VARCHAR(10),
	"mb_rtu_baud"	REAL,
	"mb_rtu_parity"	VARCHAR(5) CHECK(mb_rtu_parity IN ("even", "odd", "none")),
	"mb_rtu_data_bits"	INTEGER,
	"mb_rtu_stop_bits"	INTEGER,
	"log_interval_ms" INTEGER DEFAULT 1000 NOT NULL,
	CONSTRAINT "id_unique" CHECK(id=0),
	CONSTRAINT "min_interval_check" CHECK(log_interval_ms >= 1000)
	PRIMARY KEY("id")
);