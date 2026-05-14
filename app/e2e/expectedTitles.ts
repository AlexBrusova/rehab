/** Mirrors `src/data/constants.js` TITLES for manager / org_manager nav ids. */
export const SCREEN_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  patients: "Patients",
  rooms: "Room Map",
  medications: "Medication Distribution",
  medmanager: "Medication Management",
  groups: "Group Management",
  phones: "Management Phones",
  absences: "Absences Patients",
  summary: "Daily Summary",
  shifts: "Shift Management",
  consequences: "Consequences",
  finance: "Management General",
  manage: "Center Management",
  therapy: "Session Records",
};

/** `NAV_CFG.manager` ids in order (matches app sidebar). */
export const MANAGER_NAV_IDS = [
  "dashboard",
  "patients",
  "rooms",
  "medmanager",
  "medications",
  "groups",
  "phones",
  "absences",
  "summary",
  "shifts",
  "consequences",
  "finance",
  "manage",
  "therapy",
] as const;

/** `NAV_CFG.org_manager` — no therapy tab. */
export const ORG_MANAGER_NAV_IDS = [
  "dashboard",
  "patients",
  "rooms",
  "medmanager",
  "medications",
  "groups",
  "phones",
  "absences",
  "summary",
  "shifts",
  "consequences",
  "finance",
  "manage",
] as const;

export const COUNSELOR_NAV_IDS = [
  "dashboard",
  "patients",
  "rooms",
  "medications",
  "groups",
  "phones",
  "absences",
  "summary",
  "shifts",
  "finance",
  "consequences",
] as const;

export const DOCTOR_NAV_IDS = ["dashboard", "patients", "medmanager"] as const;

export const THERAPIST_NAV_IDS = ["dashboard", "patients", "groups", "therapy"] as const;
