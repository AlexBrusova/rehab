/**
 * Клиентская нормализация ввода и проверки формата.
 * Лимиты согласованы с `data/validationLimits.js` / `UiValidation.kt`.
 */
import { V, TIME_HHMM_RE } from "../data/validationLimits";

export function stripControlChars(s) {
  if (s == null || typeof s !== "string") return "";
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

export function clampLen(s, max) {
  const t = stripControlChars(String(s ?? ""));
  return t.length <= max ? t : t.slice(0, max);
}

/** Имя / тема: без угловых скобок и слэшей, длина по лимиту. */
export function sanitizePersonName(s) {
  return clampLen(String(s ?? "").replace(/[<>\"\\/]/g, ""), V.NAME_MAX);
}

/** Текстовые поля (описание и т.д.). */
export function sanitizeFreeText(s, max = V.NOTE_MAX) {
  return clampLen(s, max);
}

/** Удостоверение / ID: только цифры, до 9 (типичный формат в UI). */
export function sanitizeNationalIdDigits(s) {
  return String(s ?? "")
    .replace(/\D/g, "")
    .slice(0, 9);
}

/** Дата ввода DD/MM/YYYY или DD/MM/YY — только цифры и «/», до 10 символов. */
export function sanitizeDateDdMm(s) {
  let t = String(s ?? "").replace(/[^\d/]/g, "");
  const segs = t.split("/");
  if (segs.length > 3) t = `${segs[0]}/${segs[1]}/${segs.slice(2).join("")}`;
  return t.slice(0, 10);
}

/**
 * Проверка календарной даты DD/MM/YYYY или DD/MM/YY (год 00–99 → 2000–2099).
 */
export function isValidDateDdMmYyyy(s) {
  const t = String(s ?? "").trim();
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})$/);
  if (!m) return false;
  const d = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  let y = parseInt(m[3], 10);
  if (m[3].length === 2) y += 2000;
  if (Number.isNaN(d) || Number.isNaN(mo) || Number.isNaN(y)) return false;
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

export function sanitizeUsername(s) {
  return String(s ?? "")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, V.USERNAME_MAX);
}

/** Телефон: цифры, +, скобки, пробел, дефис. */
export function sanitizePhoneInput(s) {
  return clampLen(
    stripControlChars(String(s ?? "")).replace(/[^\d+\-()\s]/g, ""),
    V.SHORT_LABEL,
  );
}

export function sanitizePasswordInput(s) {
  return clampLen(s, V.PASSWORD_MAX);
}

export function sanitizeMedName(s) {
  return clampLen(String(s ?? "").replace(/[<>]/g, ""), V.MED_NAME_MAX);
}

/** Доза: буквы/цифры/пробелы/тире/точка/слэш (дроби), без управляющих. */
export function sanitizeMedDose(s) {
  let t = stripControlChars(String(s ?? "")).replace(/[<>]/g, "");
  t = t.replace(/[^\p{L}\p{N}\s./\-]/gu, "");
  return t.slice(0, V.MED_DOSE_MAX);
}

export function sanitizeTopic(s) {
  return clampLen(stripControlChars(s), V.TOPIC_MAX);
}

export function sanitizeRoomNumber(s) {
  return clampLen(stripControlChars(String(s ?? "")).replace(/[<>]/g, ""), V.ROOM_NUMBER_MAX);
}

export function sanitizeRoomBuilding(s) {
  return clampLen(stripControlChars(String(s ?? "")).replace(/[<>]/g, ""), V.ROOM_BUILDING_MAX);
}

export function sanitizeRoomCapacity(s) {
  const d = String(s ?? "").replace(/\D/g, "");
  if (!d) return "";
  let n = parseInt(d, 10);
  if (Number.isNaN(n)) return "";
  n = Math.min(V.ROOM_CAPACITY_MAX, Math.max(V.ROOM_CAPACITY_MIN, n));
  return String(n);
}

/** Сумма: неотрицательное число, до двух знаков после точки. */
export function sanitizeMoneyAmount(s) {
  let t = stripControlChars(String(s ?? "")).replace(/[^\d.]/g, "");
  const dot = t.indexOf(".");
  if (dot === -1) return t.replace(/\D/g, "").slice(0, 10);
  const intp = t.slice(0, dot).replace(/\D/g, "").slice(0, 10);
  const frac = t.slice(dot + 1).replace(/\D/g, "").slice(0, 2);
  if (frac.length === 0) {
    return t.endsWith(".") ? `${intp || "0"}.` : intp;
  }
  return `${intp || "0"}.${frac}`.slice(0, 14);
}

export function isValidMoneyAmount(s) {
  const t = String(s ?? "").trim();
  if (!t) return false;
  const n = Number(t);
  return !Number.isNaN(n) && n >= 0 && Number.isFinite(n);
}

export { TIME_HHMM_RE };

export function isValidTimeHhMm(s) {
  return typeof s === "string" && TIME_HHMM_RE.test(s.trim());
}
