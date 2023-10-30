import { object, number, boolean, string } from 'yup';

export const modbusDeviceSchema = object({
  id: number().required(),
  name: string().required(),
  g_display_reg_addr: number().min(0).max(65534).nullable(),
  g_display_reg_format: number().oneOf([16, 32]).nullable(),
  g_y_label: string().max(40).nullable(),
  is_logging: boolean().required()
});

export const removeModbusDeviceSchema = modbusDeviceSchema.pick(['id']);