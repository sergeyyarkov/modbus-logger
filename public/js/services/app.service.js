import api from "../api";

export async function configurateApp(config) {
  const {
    mb_connection_type,
    mb_tcp_ip,
    mb_tcp_port,
    mb_rtu_path,
    mb_rtu_parity,
    mb_rtu_data_bits,
    mb_rtu_stop_bits,
    mb_rtu_baud,
    log_interval_ms,
  } = config;
  let data = {};

  if (config.mb_connection_type === "TCP") {
    data = { mb_connection_type, mb_tcp_ip, mb_tcp_port, log_interval_ms };
  }

  if (config.mb_connection_type === "RTU") {
    data = { mb_rtu_path, mb_rtu_parity, mb_rtu_data_bits, mb_rtu_stop_bits, mb_rtu_baud };
  }

  const configRes = await api.patch("/app/config", data);
  if (configRes.ok) await api.post("/modbus/connect");
}
