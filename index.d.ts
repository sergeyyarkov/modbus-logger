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

export type NumberType = 'UI16' | 'I16' | 'UI32' | 'I32' | 'FP32'

export type DisplayValue = {
  data?: number;
  id: number;
  name: string;
  slave_id: number;
  reg_addr: number;
  reg_format: number;
}

export type ModbusDevice = {
  id: number;
  name: string;
  g_display_reg_addr: number | null;
  g_display_reg_format: NumberType | null;
  g_display_reg_type: "HR" | "IR";
  g_y_label: string | null;
  is_logging: boolean;
  display_values?: DisplayValue[]
}