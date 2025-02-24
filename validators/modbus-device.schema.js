import { object, number, string } from 'yup';

export const modbusDeviceSchema = object({
  id: number().required(),
  name: string().required(),
  g_display_reg_addr: number().min(0).max(65534).nullable(),
  g_display_reg_format: string().oneOf(["UI16", "I16", "UI32", "I32", "FP32"]).nullable(),
  g_display_reg_type: string().oneOf(["HR", "IR"]).nullable(),
  g_y_label: string().max(40).nullable(),
});

export const removeModbusDeviceSchema = modbusDeviceSchema.pick(['id']);
export const editModbusDeviceSchema = modbusDeviceSchema.shape({
  newId: number().required()
});