export type AppConfig = {
  mb_connection_type: "TCP" | "RTU";
  mb_tcp_ip: string | null;
  mb_tcp_port: number | null;
  mb_rtu_path: string | null;
  mb_rtu_baud: number | null;
  mb_rtu_parity: "even" | "odd" | "none" | null;
  mb_rtu_data_bits: number | null;
  mb_rtu_stop_bits: number | null;
  log_interval_ms: number;
};

export type SlaveModbusDevice = {
  id: number;
  name: string;
  display_reg_addr: number | null;
  display_reg_format: number | null;
  is_logging: boolean;
}