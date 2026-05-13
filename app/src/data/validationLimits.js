/**
 * Лимиты полей — зеркало `backend/.../UiValidation.kt`.
 * При изменении бэкенда обновляйте оба места.
 */
export const V = {
  ID_MAX: 64,
  NAME_MAX: 255,
  USERNAME_MAX: 80,
  PASSWORD_MAX: 128,
  SHORT_LABEL: 120,
  NOTE_MAX: 4000,
  TOPIC_MAX: 500,
  DATE_UI_MAX: 32,
  TIME_HHMM_MAX: 16,
  MED_NAME_MAX: 200,
  MED_DOSE_MAX: 64,
  MED_UNIT_MAX: 32,
  MED_PRESCRIBED_BY_MAX: 120,
  MED_TIMES_LIST_MAX: 4,
  ROOM_NUMBER_MAX: 64,
  ROOM_BUILDING_MAX: 120,
  ROOM_CAPACITY_MIN: 1,
  ROOM_CAPACITY_MAX: 50,
  SHIFT_LABEL_MAX: 32,
  HANDOFF_NAME_MAX: 120,
};

/** HH:mm 00:00–23:59 — как `UiValidation.TIME_HHMM_PATTERN` на бэкенде. */
export const TIME_HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
