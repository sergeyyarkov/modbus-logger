import { object, number, boolean, string } from 'yup';

export const displayValueSchema = object({
  id: number().required(),
  name: string().required(),
  slave_id: number().required(),
  reg_addr: number().min(0).max(65534).required(),
  reg_format: string().oneOf(["UI16", "I16", "UI32", "I32", "FP32"]).required(),
  reg_type: string().oneOf(["HR", "IR"]).required()
})

export const removeDisplayValueSchema = displayValueSchema.pick(['id']);