const BASE_URL = import.meta.env.VITE_API_URL;

const api = {
  get: (path: string) => fetch(`${BASE_URL}${path}`),
  post: (path: string, body: unknown) =>
    fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
};

export default api;
