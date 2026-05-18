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
  validate: (v) => v.trim().length < 2 ? "Minimum 2 characters" : null,
  hint: "Full name, 2–255 characters",
};

export const dateDdMmRules = {
  sanitize: sanitizeDateDdMm,
  validate: (v) => {
    if (!v.trim()) return "Required field";
    if (!isValidDateDdMmYyyy(v.trim())) return "Format: DD/MM/YYYY";
    return null;
  },
  hint: "Format: DD/MM/YYYY",
  inputMode: "numeric",
  maxLength: 10,
};

export const dateDdMmOptionalRules = {
  sanitize: sanitizeDateDdMm,
  validate: (v) => v.trim() && !isValidDateDdMmYyyy(v.trim()) ? "Format: DD/MM/YYYY" : null,
  hint: "Format: DD/MM/YYYY (optional)",
  inputMode: "numeric",
  maxLength: 10,
};

export const medNameRules = {
  sanitize: sanitizeMedName,
  validate: (v) => !v.trim() ? "Enter medication name" : null,
  hint: `Medication name, up to ${V.MED_NAME_MAX} characters`,
};

export const medDoseRules = {
  sanitize: sanitizeMedDose,
  validate: (v) => !v.trim() ? "Enter dose" : null,
  hint: "Dose and unit (e.g. 40 mg)",
};

export const roomNumberRules = {
  sanitize: sanitizeRoomNumber,
  validate: (v) => !v.trim() ? "Enter room number" : null,
  hint: `Room number, up to ${V.ROOM_NUMBER_MAX} characters`,
};

export const roomBuildingRules = {
  sanitize: sanitizeRoomBuilding,
  validate: (v) => !v.trim() ? "Enter building name" : null,
  hint: `Building, up to ${V.ROOM_BUILDING_MAX} characters`,
};

export const roomCapacityRules = {
  sanitize: sanitizeRoomCapacity,
  validate: (v) => {
    const n = parseInt(v, 10);
    if (Number.isNaN(n) || n < V.ROOM_CAPACITY_MIN || n > V.ROOM_CAPACITY_MAX) {
      return `Number from ${V.ROOM_CAPACITY_MIN} to ${V.ROOM_CAPACITY_MAX}`;
    }
    return null;
  },
  hint: `Capacity: ${V.ROOM_CAPACITY_MIN}–${V.ROOM_CAPACITY_MAX} patients`,
  inputMode: "numeric",
  maxLength: 2,
};

const USERNAME_RE = /^[a-z0-9._-]+$/i;

export const usernameRules = {
  sanitize: sanitizeUsername,
  validate: (v) => {
    if (!v.trim()) return "Enter username";
    if (!USERNAME_RE.test(v.trim())) return "Only a-z, 0-9, dot, dash, underscore";
    return null;
  },
  hint: "Only a-z, 0-9, dot, dash, underscore",
};

export const userFullNameRules = patientNameRules;
