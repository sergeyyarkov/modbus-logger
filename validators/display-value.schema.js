import { object, number, boolean, string } from 'yup';

export const displayValueSchema = object({
  id: number().required(),
  name: string().required(),
  slave_id: number().required(),
  reg_addr: number().min(0).max(65534).required(),
  reg_format: number().oneOf([16, 32]).required()
})

export const removeDisplayValueSchema = displayValueSchema.pick(['id']);