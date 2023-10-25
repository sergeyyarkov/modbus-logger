import { object, number, string } from "yup";

const requiredIfConnTypeEquals = (type) => ({
  is: (v) => v === type,
  then: (schema) => schema.required(),
});

export const appConfigSchema = object({
  mb_connection_type: string().oneOf(["TCP", "RTU"]).required(),
  mb_tcp_ip: string().when("mb_connection_type", requiredIfConnTypeEquals("TCP")),
  mb_tcp_port: number().when("mb_connection_type", requiredIfConnTypeEquals("TCP")),
  mb_rtu_path: string().when("mb_connection_type", requiredIfConnTypeEquals("RTU")),
  mb_rtu_baud: number().when("mb_connection_type", requiredIfConnTypeEquals("RTU")),
  mb_rtu_parity: string().oneOf(["none", "even", "odd"]).when("mb_connection_type", requiredIfConnTypeEquals("RTU")),
  mb_rtu_data_bits: number().oneOf([7, 8, 9]).when("mb_connection_type", requiredIfConnTypeEquals("RTU")),
  mb_rtu_stop_bits: number().oneOf([1, 2]).when("mb_connection_type", requiredIfConnTypeEquals("RTU")),
  log_interval_ms: number().min(1000).required(),
});
