const urlPrefix = "/api";

export default {
  async patch(path, data) {
    const response = await fetch(`${urlPrefix}${path}`, {
      method: "PATCH",
      body: new URLSearchParams(data),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response;
  },

  async post(path, data) {
    const response = await fetch(`${urlPrefix}${path}`, {
      method: "POST",
      body: new URLSearchParams(data),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response;
  },
};
