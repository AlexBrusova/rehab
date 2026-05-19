import { useState } from "react";
import { C } from "../data/constants";
import { V } from "../data/validationLimits";
import { sanitizeMedDose, sanitizeMedName } from "../lib/inputSanitize";
import { Btn, FI, FS } from "../components/ui";

export default function EditMedRow({ med, onSave, onCancel, t = (k) => k, dir = "ltr" }) {
  const [name, setName] = useState(med.name);
  const [dose, setDose] = useState(med.dose);
  const [unit, setUnit] = useState(med.unit);
  const [times, setTimes] = useState({
    morning: med.morning,
    noon: med.noon,
    evening: med.evening,
    night: med.night || false,
  });
  return (
    <div
      style={{
        background: "#f0fafa",
        borderRadius: 10,
        border: `2px solid ${C.teal}`,
        padding: 14,
        marginBottom: 8,
      }}
    >
      {" "}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 80px",
          gap: 8,
          marginBottom: 8,
        }}
      >
        {" "}
        <FI
          value={name}
          onChange={setName}
          placeholder={t('medManager.editMedNamePlaceholder')}
          sanitize={sanitizeMedName}
          maxLength={V.MED_NAME_MAX}
          dir={dir}
        />{" "}
        <FI
          value={dose}
          onChange={setDose}
          placeholder={t('medManager.editDosePlaceholder')}
          sanitize={sanitizeMedDose}
          maxLength={V.MED_DOSE_MAX}
          dir={dir}
        />{" "}
        <FS
          value={unit}
          onChange={setUnit}
          options={["mg", "mcg", "ml", "IU", "g"]}
          dir={dir}
        />{" "}
      </div>{" "}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {" "}
        {[
          { key: "morning", label: t('medManager.morningLabel') },
          { key: "noon", label: t('medManager.noonLabel') },
          { key: "evening", label: t('medManager.eveningLabel') },
          { key: "night", label: t('medManager.nightLabel') },
        ].map(({ key, label }) => (
          <div
            key={key}
            onClick={() => setTimes((prev) => ({ ...prev, [key]: !prev[key] }))}
            style={{
              padding: "5px 12px",
              borderRadius: 20,
              border: `2px solid ${times[key] ? C.teal : C.border}`,
              background: times[key] ? C.teal : "#fff",
              color: times[key] ? "#fff" : C.soft,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {label}
          </div>
        ))}{" "}
      </div>{" "}
      <div style={{ display: "flex", gap: 8 }}>
        <Btn
          color="teal"
          size="sm"
          onClick={() => onSave({ name, dose, unit, ...times })}
        >
          {t('common.saveButton')}
        </Btn>
        <Btn color="outline" size="sm" onClick={onCancel}>
          {t('common.cancelButton')}
        </Btn>
      </div>{" "}
    </div>
  );
}
