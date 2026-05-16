package com.rehabcenter.validation

import com.rehabcenter.validation.UiValidation.ABSENCE_STATUS
import com.rehabcenter.validation.UiValidation.CONSEQUENCE_STATUS
import com.rehabcenter.validation.UiValidation.CONSEQUENCE_TYPE_MAX
import com.rehabcenter.validation.UiValidation.DATE_UI_MAX
import com.rehabcenter.validation.UiValidation.FINANCE_TYPE
import com.rehabcenter.validation.UiValidation.HANDOFF_NAME_MAX
import com.rehabcenter.validation.UiValidation.HEX_COLOR
import com.rehabcenter.validation.UiValidation.ID_MAX
import com.rehabcenter.validation.UiValidation.MED_DOSE_MAX
import com.rehabcenter.validation.UiValidation.MED_NAME_MAX
import com.rehabcenter.validation.UiValidation.MED_PRESCRIBED_BY_MAX
import com.rehabcenter.validation.UiValidation.MED_TIMES_LIST_MAX
import com.rehabcenter.validation.UiValidation.MED_UNIT_MAX
import com.rehabcenter.validation.UiValidation.NAME_MAX
import com.rehabcenter.validation.UiValidation.NOTE_MAX
import com.rehabcenter.validation.UiValidation.PASSWORD_MAX
import com.rehabcenter.validation.UiValidation.PATIENT_STATUS
import com.rehabcenter.validation.UiValidation.PHONE_STATUS
import com.rehabcenter.validation.UiValidation.ROLE
import com.rehabcenter.validation.UiValidation.ROOM_BUILDING_MAX
import com.rehabcenter.validation.UiValidation.ROOM_CAPACITY_MAX
import com.rehabcenter.validation.UiValidation.ROOM_CAPACITY_MIN
import com.rehabcenter.validation.UiValidation.ROOM_NUMBER_MAX
import com.rehabcenter.validation.UiValidation.SCHEDULE_SHIFT_TYPE_MAX
import com.rehabcenter.validation.UiValidation.SHIFT_STATUS
import com.rehabcenter.validation.UiValidation.SHIFT_TYPE_MAX
import com.rehabcenter.validation.UiValidation.SHORT_LABEL
import com.rehabcenter.validation.UiValidation.THERAPY_URGENCY
import com.rehabcenter.validation.UiValidation.TIME_HHMM_MAX
import com.rehabcenter.validation.UiValidation.TIME_HHMM_PATTERN
import com.rehabcenter.validation.UiValidation.TOPIC_MAX
import com.rehabcenter.validation.UiValidation.USERNAME_MAX

object FieldRulesRegistry {
    val ALL: Map<String, Map<String, FieldConstraints>> = mapOf(
        "login" to mapOf(
            "username" to FieldConstraints(required = true, maxLength = USERNAME_MAX),
            "password" to FieldConstraints(required = true, maxLength = PASSWORD_MAX),
        ),
        "user" to mapOf(
            "name" to FieldConstraints(required = true, maxLength = NAME_MAX),
            "username" to FieldConstraints(required = true, maxLength = USERNAME_MAX),
            "role" to FieldConstraints(required = true, pattern = ROLE),
            "roleLabel" to FieldConstraints(required = true, maxLength = SHORT_LABEL),
            "initials" to FieldConstraints(maxLength = 8),
            "color" to FieldConstraints(pattern = HEX_COLOR),
            "phone" to FieldConstraints(maxLength = 64),
            "password" to FieldConstraints(maxLength = PASSWORD_MAX),
        ),
        "patient" to mapOf(
            "name" to FieldConstraints(required = true, maxLength = NAME_MAX),
            "dob" to FieldConstraints(required = true, maxLength = DATE_UI_MAX),
            "admitDate" to FieldConstraints(required = true, maxLength = DATE_UI_MAX),
            "houseId" to FieldConstraints(required = true, maxLength = ID_MAX),
            "roomId" to FieldConstraints(maxLength = ID_MAX),
            "status" to FieldConstraints(pattern = PATIENT_STATUS),
            "mood" to FieldConstraints(min = 0, max = 10),
            "daysInRehab" to FieldConstraints(min = 0, max = 100000),
        ),
        "room" to mapOf(
            "number" to FieldConstraints(required = true, maxLength = ROOM_NUMBER_MAX),
            "building" to FieldConstraints(required = true, maxLength = ROOM_BUILDING_MAX),
            "capacity" to FieldConstraints(required = true, min = ROOM_CAPACITY_MIN, max = ROOM_CAPACITY_MAX),
            "houseId" to FieldConstraints(required = true, maxLength = ID_MAX),
        ),
        "house" to mapOf(
            "name" to FieldConstraints(required = true, maxLength = NAME_MAX),
            "city" to FieldConstraints(required = true, maxLength = NAME_MAX),
            "color" to FieldConstraints(maxLength = SHORT_LABEL, pattern = HEX_COLOR),
        ),
        "med" to mapOf(
            "name" to FieldConstraints(required = true, maxLength = MED_NAME_MAX),
            "dose" to FieldConstraints(required = true, maxLength = MED_DOSE_MAX),
            "unit" to FieldConstraints(maxLength = MED_UNIT_MAX),
            "times" to FieldConstraints(
                allowedValues = listOf("morning", "noon", "evening", "night"),
                max = MED_TIMES_LIST_MAX,
            ),
            "prescribedBy" to FieldConstraints(maxLength = MED_PRESCRIBED_BY_MAX),
            "notes" to FieldConstraints(maxLength = NOTE_MAX),
        ),
        "absence" to mapOf(
            "type" to FieldConstraints(maxLength = SHORT_LABEL),
            "startDate" to FieldConstraints(required = true, maxLength = DATE_UI_MAX),
            "endDate" to FieldConstraints(required = true, maxLength = DATE_UI_MAX),
            "status" to FieldConstraints(pattern = ABSENCE_STATUS),
        ),
        "consequence" to mapOf(
            "type" to FieldConstraints(required = true, maxLength = CONSEQUENCE_TYPE_MAX),
            "description" to FieldConstraints(required = true, maxLength = NOTE_MAX),
            "date" to FieldConstraints(required = true, maxLength = DATE_UI_MAX),
            "status" to FieldConstraints(pattern = CONSEQUENCE_STATUS),
        ),
        "shift" to mapOf(
            "shift" to FieldConstraints(maxLength = SHIFT_TYPE_MAX),
            "status" to FieldConstraints(pattern = SHIFT_STATUS),
            "note" to FieldConstraints(maxLength = NOTE_MAX),
            "receivedFrom" to FieldConstraints(maxLength = HANDOFF_NAME_MAX),
            "handedTo" to FieldConstraints(maxLength = HANDOFF_NAME_MAX),
            "start" to FieldConstraints(maxLength = TIME_HHMM_MAX, pattern = TIME_HHMM_PATTERN),
            "end" to FieldConstraints(maxLength = TIME_HHMM_MAX, pattern = TIME_HHMM_PATTERN),
        ),
        "schedule" to mapOf(
            "date" to FieldConstraints(required = true, maxLength = DATE_UI_MAX),
            "shiftType" to FieldConstraints(maxLength = SCHEDULE_SHIFT_TYPE_MAX),
            "note" to FieldConstraints(maxLength = NOTE_MAX),
        ),
        "group" to mapOf(
            "topic" to FieldConstraints(maxLength = TOPIC_MAX),
            "notes" to FieldConstraints(maxLength = NOTE_MAX),
            "time" to FieldConstraints(maxLength = TIME_HHMM_MAX),
            "date" to FieldConstraints(required = true, maxLength = DATE_UI_MAX),
        ),
        "phone" to mapOf(
            "givenAt" to FieldConstraints(required = true, maxLength = TIME_HHMM_MAX, pattern = TIME_HHMM_PATTERN),
            "returnBy" to FieldConstraints(required = true, maxLength = TIME_HHMM_MAX, pattern = TIME_HHMM_PATTERN),
            "status" to FieldConstraints(pattern = PHONE_STATUS),
        ),
        "medDistribution" to mapOf(
            "time" to FieldConstraints(required = true, maxLength = TIME_HHMM_MAX, pattern = TIME_HHMM_PATTERN),
            "notes" to FieldConstraints(maxLength = NOTE_MAX),
        ),
        "cashboxEntry" to mapOf(
            "type" to FieldConstraints(required = true, pattern = FINANCE_TYPE),
            "amount" to FieldConstraints(required = true, min = -1000000000, max = 1000000000),
            "cat" to FieldConstraints(maxLength = SHORT_LABEL),
            "note" to FieldConstraints(maxLength = NOTE_MAX),
            "date" to FieldConstraints(required = true, maxLength = DATE_UI_MAX),
            "time" to FieldConstraints(required = true, maxLength = TIME_HHMM_MAX, pattern = TIME_HHMM_PATTERN),
        ),
        "cashboxCount" to mapOf(
            "amount" to FieldConstraints(required = true, min = 0, max = 1000000000),
            "note" to FieldConstraints(maxLength = NOTE_MAX),
            "date" to FieldConstraints(required = true, maxLength = DATE_UI_MAX),
        ),
        "finance" to mapOf(
            "type" to FieldConstraints(required = true, pattern = FINANCE_TYPE),
            "amount" to FieldConstraints(required = true, min = -1000000000, max = 1000000000),
            "source" to FieldConstraints(maxLength = SHORT_LABEL),
            "note" to FieldConstraints(maxLength = NOTE_MAX),
            "date" to FieldConstraints(required = true, maxLength = DATE_UI_MAX),
        ),
        "therapySession" to mapOf(
            "topic" to FieldConstraints(maxLength = TOPIC_MAX),
            "notes" to FieldConstraints(maxLength = NOTE_MAX),
            "urgency" to FieldConstraints(pattern = THERAPY_URGENCY),
        ),
        "shiftDistribution" to mapOf(
            "shiftId" to FieldConstraints(required = true, maxLength = ID_MAX),
            "userId" to FieldConstraints(required = true, maxLength = ID_MAX),
            "role" to FieldConstraints(maxLength = SHORT_LABEL),
        ),
    )
}
