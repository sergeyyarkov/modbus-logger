/**
 * Read number from buffer
 * @param {Buffer} buf
 * @param {import("..").NumberType} type 
 * @param {"BE" | "LE"} order 
 */
export function readNumberFromBuf(buf, type, order) {
  /* Big-Endian */
  if (type === 'UI16' && order === 'BE') return Buffer.from(buf).readUInt16BE();
  if (type === 'I16' && order === 'BE') return Buffer.from(buf).readInt16BE();
  if (type === 'UI32' && order === 'BE') return Buffer.from(buf).readUint32BE();
  if (type === 'I32' && order === 'BE') return Buffer.from(buf).readInt32BE();
  if (type === 'FP32' && order === 'BE') return Buffer.from(buf).readFloatBE();

  /* Little-Endian */
  if (type === 'UI16' && order === 'LE') return Buffer.from(buf).readUInt16LE();
  if (type === 'I16' && order === 'LE') return Buffer.from(buf).readInt16LE();
  if (type === 'UI32' && order === 'LE') return Buffer.from(buf).readUint32LE();
  if (type === 'I32' && order === 'LE') return Buffer.from(buf).readInt32LE();
  if (type === 'FP32' && order === 'LE') return Buffer.from(buf).readFloatLE();

  if (type === 'BOOL') return Buffer.from(buf).readUint8();
}