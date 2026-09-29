import { bridge } from "../bridge/max";

const API_URL = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/+$/, "");

export const USE_MOCK = API_URL === "";


export const currentUserId = () =>
  bridge.user?.id ?? Number(import.meta.env.VITE_DEV_MAX_USER_ID || 1);


export const apiUrl = (path) =>
  new URL(`${API_URL}${path}`, window.location.href).href;

const DETAILS = {
  "Receipt not found": "Квитанция не найдена",
  "Receipt not checked yet": "Квитанция ещё не проверена на ошибки",
  "No errors found": "В квитанции нет ошибок — жалоба не нужна",
  "User not found": "Пользователь не найден",
  "Parse error": "Не удалось распознать квитанцию",
};

export class ApiError extends Error {
  constructor(status, message) {
    super(message || `Ошибка сервера (${status})`);
    this.status = status;
  }
}

const errorMessage = async (res) => {
  const text = await res.text().catch(() => "");
  try {
    const { detail } = JSON.parse(text);
    if (typeof detail === "string") return DETAILS[detail] ?? detail;
  } catch {
  }
  return res.status >= 500 || !text ? "" : text;
};

export const request = async (
  path,
  { method = "GET", body, as = "json" } = {},
) => {
  const headers = { Accept: as === "json" ? "application/json" : "*/*" };
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
  if (!res.ok) throw new ApiError(res.status, await errorMessage(res));
  if (as === "blob") return res.blob();
  return res.status === 204 ? null : res.json();
};
