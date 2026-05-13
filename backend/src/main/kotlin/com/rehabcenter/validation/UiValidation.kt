package com.rehabcenter.validation

/** Общие ограничения длины/формата для полей UI (согласовано с `docs/api.md` и фронтом). */
object UiValidation {
    const val ID_MAX = 64
    const val NAME_MAX = 255
    const val USERNAME_MAX = 80
    const val PASSWORD_MAX = 128
    const val SHORT_LABEL = 120
    const val NOTE_MAX = 4000
    const val TOPIC_MAX = 500
    const val DATE_UI_MAX = 32
    const val TIME_HHMM_MAX = 16
    /** Время суток в теле медикамента (список `times`). */
    const val MED_TIME_SLOT = "^(morning|noon|evening|night)$"
    const val MED_TIMES_LIST_MAX = 4
    const val MED_NAME_MAX = 200
    const val MED_DOSE_MAX = 64
    const val MED_UNIT_MAX = 32
    const val MED_PRESCRIBED_BY_MAX = 120
    const val ROOM_NUMBER_MAX = 64
    const val ROOM_BUILDING_MAX = 120
    const val ROOM_CAPACITY_MIN = 1
    const val ROOM_CAPACITY_MAX = 50
    const val SHIFT_TYPE_MAX = 32
    const val SCHEDULE_SHIFT_TYPE_MAX = 32
    const val CONSEQUENCE_TYPE_MAX = 64
    const val HANDOFF_NAME_MAX = 120
    /** Часы:минуты 00:00–23:59 (телефоны, касса, выдача лекарств). */
    const val TIME_HHMM_PATTERN = "^([01]\\d|2[0-3]):[0-5]\\d$"
    const val HEX_COLOR = "^#[0-9A-Fa-f]{6}$"
    const val ROLE =
        "^(org_manager|manager|counselor|doctor|therapist)$"
    const val PATIENT_STATUS = "^(active|archived)$"
    const val SHIFT_STATUS = "^(ACTIVE|pending|completed)$"
    const val PHONE_STATUS = "^(active|returned)$"
    const val CONSEQUENCE_STATUS = "^(pending|approved|rejected)$"
    const val ABSENCE_STATUS = "^(pending|approved|active|returned)$"
    const val FINANCE_TYPE = "^(deposit|withdrawal)$"
    const val THERAPY_URGENCY = "^(NORMAL|URGENT|ATTENTION)$"
}
