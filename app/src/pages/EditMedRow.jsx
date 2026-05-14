import { useState } from "react";
import { C } from "../data/constants";
import { V } from "../data/validationLimits";
import { sanitizeMedDose, sanitizeMedName } from "../lib/inputSanitize";
import { Btn, FI, FS } from "../components/ui";

export default function EditMedRow({ med, onSave, onCancel }) {
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
          placeholder="Medication Name"
          sanitize={sanitizeMedName}
          maxLength={V.MED_NAME_MAX}
        />{" "}
        <FI
          value={dose}
          onChange={setDose}
          placeholder="Dose"
          sanitize={sanitizeMedDose}
          maxLength={V.MED_DOSE_MAX}
        />{" "}
        <FS
          value={unit}
          onChange={setUnit}
          options={["mg", "mcg", "ml", "IU", "g"]}
        />{" "}
      </div>{" "}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {" "}
        {["morning", "noon", "evening", "night"].map((k, i) => {
          const l = ["Morning", "Noon", "Evening", "Night"][i];
          return (
            <div
              key={k}
              onClick={() => setTimes((t) => ({ ...t, [k]: !t[k] }))}
              style={{
                padding: "5px 12px",
                borderRadius: 20,
                border: `2px solid ${times[k] ? C.teal : C.border}`,
                background: times[k] ? C.teal : "#fff",
                color: times[k] ? "#fff" : C.soft,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {l}
            </div>
          );
        })}{" "}
      </div>{" "}
      <div style={{ display: "flex", gap: 8 }}>
        <Btn
          color="teal"
          size="sm"
          onClick={() => onSave({ name, dose, unit, ...times })}
        >
          ✓ Save
        </Btn>
        <Btn color="outline" size="sm" onClick={onCancel}>
          Cancel
        </Btn>
      </div>{" "}
    </div>
  );
}
