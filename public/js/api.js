const urlPrefix = "/api";

/**
 * Response handler
 * @param {Response} response
 */
async function handle(response) {
  const data = await response.json();
  if (!response.ok) return Promise.reject(data.error || response.statusText);
  return data;
}

export default {
  async patch(path, data) {
    const response = await fetch(`${urlPrefix}${path}`, {
      method: "PATCH",
      body: new URLSearchParams(data),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return handle(response);
  },

  async post(path, data) {
    const response = await fetch(`${urlPrefix}${path}`, {
      method: "POST",
      body: new URLSearchParams(data),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return await handle(response);
  },

  async get(path) {
    const response = await fetch(`${urlPrefix}${path}`, {
      method: "GET",
    });
    return await handle(response);
  },
};
