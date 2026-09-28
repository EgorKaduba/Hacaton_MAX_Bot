const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export const USE_MOCK = !API_URL;

export class ApiError extends Error {
  constructor(status, message) {
    super(message || `Ошибка сервера (${status})`);
    this.status = status;
  }
}

export const request = async (path, { method = "GET", body } = {}) => {
  const headers = { Accept: "application/json" };
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body });
  } catch {
    throw new ApiError(0, "Нет соединения с сервером");
  }
  if (!res.ok) throw new ApiError(res.status, await res.text().catch(() => ""));
  return res.status === 204 ? null : res.json();
};
