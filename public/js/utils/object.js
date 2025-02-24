/**
 * Deletes specified keys from object
 * @param {object} obj
 * @param {string[]} keys
 * @returns new object
 */
export function objKeysExclude(obj, keys) {
  const res = structuredClone(obj);
  Object.keys(res).forEach(k => keys.includes(k) && delete res[k]);
  return res;
}

export function dellNullableKeys(obj) {
  const res = structuredClone(obj);
  Object.keys(res).forEach(k => obj[k] === null && delete res[k])
  return res;
}