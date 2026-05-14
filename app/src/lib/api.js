import { V } from "../data/validationLimits";

/** Пустая строка (Docker + nginx) → запросы на тот же origin, `/api` проксируется. */
const envBase = import.meta.env.VITE_API_URL;
const BASE =
  envBase === undefined || envBase === null || String(envBase).trim() === ""
    ? ""
    : String(envBase).replace(/\/$/, "");

/** Таймаут одного запроса к API (мс). Переопределение: `VITE_API_TIMEOUT_MS=60000`. */
export const API_FETCH_TIMEOUT_MS =
  Number(import.meta.env.VITE_API_TIMEOUT_MS) > 0
    ? Number(import.meta.env.VITE_API_TIMEOUT_MS)
    : 45_000;

export const getToken = () => localStorage.getItem("token");
export const setToken = (t) => localStorage.setItem("token", t);
export const removeToken = () => localStorage.removeItem("token");

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};
export const setStoredUser = (u) => localStorage.setItem("user", JSON.stringify(u));
export const removeStoredUser = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
};

/**
 * @param {number} ms
 * @param {AbortSignal | undefined} userSignal
 * @returns {{ signal: AbortSignal, clear: () => void }}
 */
function abortWithTimeout(ms, userSignal) {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    try {
      controller.abort(new DOMException(`Request timed out after ${ms}ms`, "TimeoutError"));
    } catch {
      controller.abort();
    }
  }, ms);
  const clear = () => clearTimeout(timer);

  if (userSignal) {
    if (userSignal.aborted) {
      clear();
      controller.abort(userSignal.reason);
      return { signal: controller.signal, clear };
    }
    userSignal.addEventListener(
      "abort",
      () => {
        clear();
        controller.abort(userSignal.reason);
      },
      { once: true },
    );
  }

  return { signal: controller.signal, clear };
}

/**
 * @param {Response} res
 * @returns {Promise<string>}
 */
async function readApiErrorMessage(res) {
  const text = await res.text();
  if (!text) return res.statusText || `HTTP ${res.status}`;
  try {
    const j = JSON.parse(text);
    if (j && typeof j === "object") {
      if (typeof j.error === "string" && j.error) {
        let msg = j.error;
        if (typeof j.details === "string" && j.details) msg += `: ${j.details}`;
        if (j.fields && typeof j.fields === "object") {
          const parts = Object.entries(j.fields).map(([k, v]) => `${k}: ${v}`);
          if (parts.length) msg += ` (${parts.join("; ")})`;
        }
        return msg;
      }
    }
  } catch {
    /* not JSON */
  }
  return text.length > 500 ? `${text.slice(0, 500)}…` : text;
}

export async function login(username, password) {
  const u = String(username ?? "").trim();
  const p = String(password ?? "");
  if (!u || !p) throw new Error("Invalid username or password");
  if (u.length > V.USERNAME_MAX || p.length > V.PASSWORD_MAX) {
    throw new Error("Invalid username or password");
  }
  const { signal, clear } = abortWithTimeout(API_FETCH_TIMEOUT_MS, undefined);
  let res;
  try {
    res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p }),
      signal,
    });
  } catch (e) {
    clear();
    if (e?.name === "AbortError" || e?.name === "TimeoutError") {
      throw new Error("Request timed out. Check your connection and try again.");
    }
    throw new Error(e?.message || "Network error");
  }
  clear();
  if (!res.ok) {
    const msg = await readApiErrorMessage(res);
    throw new Error(msg || "Invalid username or password");
  }
  return res.json();
}

export async function authFetch(path, options = {}) {
  const { signal: userSignal, headers: optHeaders, ...fetchOpts } = options;
  const { signal, clear } = abortWithTimeout(API_FETCH_TIMEOUT_MS, userSignal);
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...fetchOpts,
      signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
        ...(optHeaders || {}),
      },
    });
  } catch (e) {
    clear();
    if (e?.name === "AbortError" || e?.name === "TimeoutError") {
      throw new Error("Request timed out. Check your connection and try again.");
    }
    throw new Error(e?.message || "Network error");
  }
  clear();

  if (res.status === 401) {
    removeStoredUser();
    window.location.reload();
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const msg = await readApiErrorMessage(res);
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return res.json();
}
