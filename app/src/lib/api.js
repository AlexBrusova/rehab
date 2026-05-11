const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const getToken = () => localStorage.getItem("token");
export const setToken = (t) => localStorage.setItem("token", t);
export const removeToken = () => localStorage.removeItem("token");

export const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
};
export const setStoredUser = (u) => localStorage.setItem("user", JSON.stringify(u));
export const removeStoredUser = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
};

export async function login(username, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Invalid username or password");
  return res.json();
}

export async function authFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    removeStoredUser();
    window.location.reload();
    return;
  }
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
