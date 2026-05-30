const BASE_URL = import.meta.env.VITE_API_URL;

let _getToken: (() => Promise<string>) | null = null;

export const setTokenGetter = (getter: () => Promise<string>) => {
  _getToken = getter;
};

const authHeaders = async (): Promise<HeadersInit> => {
  if (!_getToken) return {};
  try {
    const token = await _getToken();
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
};

const api = {
  get: async (path: string) => {
    const headers = await authHeaders();
    return fetch(`${BASE_URL}${path}`, { headers });
  },
  post: async (path: string, body: unknown) => {
    const headers = await authHeaders();
    return fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
  },
  patch: async (path: string, body: unknown) => {
    const headers = await authHeaders();
    return fetch(`${BASE_URL}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
  },
};

export default api;
