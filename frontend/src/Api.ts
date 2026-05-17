const BASE_URL = import.meta.env.VITE_API_URL;

const api = {
  get: (path: string) =>
    fetch(`${BASE_URL}${path}`, {
      credentials: "include"
    }),
  post: (path: string, body: unknown) =>
    fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include"
    })
};

export default api;
