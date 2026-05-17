import {
  sanitizePersonName,
  sanitizeDateDdMm,
  isValidDateDdMmYyyy,
  sanitizeMedName,
  sanitizeMedDose,
  sanitizeRoomNumber,
  sanitizeRoomBuilding,
  sanitizeRoomCapacity,
  sanitizeUsername,
} from "./inputSanitize";
import { V } from "../data/validationLimits";

export const patientNameRules = {
  sanitize: sanitizePersonName,
  validate: (v) => v.trim().length < 2 ? "Минимум 2 символа" : null,
  hint: "Имя и фамилия, 2–255 символов",
};

export const dateDdMmRules = {
  sanitize: sanitizeDateDdMm,
  validate: (v) => {
    if (!v.trim()) return "Обязательное поле";
    if (!isValidDateDdMmYyyy(v.trim())) return "Формат: ДД/ММ/ГГГГ";
    return null;
  },
  hint: "Формат: ДД/ММ/ГГГГ",
};

export const dateDdMmOptionalRules = {
  sanitize: sanitizeDateDdMm,
  validate: (v) => v.trim() && !isValidDateDdMmYyyy(v.trim()) ? "Формат: ДД/ММ/ГГГГ" : null,
  hint: "Формат: ДД/ММ/ГГГГ (необязательно)",
};

export const medNameRules = {
  sanitize: sanitizeMedName,
  validate: (v) => !v.trim() ? "Введите название препарата" : null,
  hint: `Название препарата, до ${V.MED_NAME_MAX} символов`,
};

export const medDoseRules = {
  sanitize: sanitizeMedDose,
  validate: (v) => !v.trim() ? "Введите дозу" : null,
  hint: "Доза и единица (напр. 40 мг)",
};

export const roomNumberRules = {
  sanitize: sanitizeRoomNumber,
  validate: (v) => !v.trim() ? "Введите номер комнаты" : null,
  hint: `Номер комнаты, до ${V.ROOM_NUMBER_MAX} символов`,
};

export const roomBuildingRules = {
  sanitize: sanitizeRoomBuilding,
  validate: (v) => !v.trim() ? "Введите название корпуса" : null,
  hint: `Корпус, до ${V.ROOM_BUILDING_MAX} символов`,
};

export const roomCapacityRules = {
  sanitize: sanitizeRoomCapacity,
  validate: (v) => {
    const n = parseInt(v, 10);
    if (Number.isNaN(n) || n < V.ROOM_CAPACITY_MIN || n > V.ROOM_CAPACITY_MAX) {
      return `Число от ${V.ROOM_CAPACITY_MIN} до ${V.ROOM_CAPACITY_MAX}`;
    }
    return null;
  },
  hint: `Вместимость: ${V.ROOM_CAPACITY_MIN}–${V.ROOM_CAPACITY_MAX} пациентов`,
};

export const usernameRules = {
  sanitize: sanitizeUsername,
  validate: (v) => !v.trim() ? "Введите логин" : null,
  hint: "Только a-z, 0-9, точка, дефис, подчёркивание",
};

export const userFullNameRules = {
  sanitize: sanitizePersonName,
  validate: (v) => v.trim().length < 2 ? "Минимум 2 символа" : null,
  hint: "Имя и фамилия, 2–255 символов",
};
