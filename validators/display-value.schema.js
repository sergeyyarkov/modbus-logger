import { object, number, string } from 'yup';

export const displayValueSchema = object({
  id: number().required(),
  name: string().required(),
  slave_id: number().required(),
  reg_addr: number().min(0).max(65534).required(),
  reg_format: string().oneOf(["UI16", "I16", "UI32", "I32", "FP32", "BOOL"]).required(),
  reg_type: string().oneOf(["HR", "IR", "DI", "DO"]).required()
})

export const removeDisplayValueSchema = displayValueSchema.pick(['id']);

// TODO: On creating "reg_format" can be BOOL if "reg_type" is "DI" or "DO"
export const createDisplayValueSchema = displayValueSchema.omit(['id'])