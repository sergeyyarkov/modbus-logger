
/**
 * @param {import('express').Response} res 
 */
export function setSSEHeaders(res) {
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Connection", "keep-alive");
}

/**
 * @param {any} data
 * @param {string} eventType
 */
export function serializeSSEData(data, eventType) {
  return `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
}