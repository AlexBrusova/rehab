import { useState } from "react";
import { C } from "../data/constants";
import { Card, CT, Alrt, Btn, FI, FS } from "../components/ui";
import EditMedRow from "./EditMedRow";

export default function MedManager({
  patients,
  meds,
  setMeds,
  user,
  toast,
}) {
  const [selPat, setSelPat] = useState(patients[0]?.id || "");
  const [editMed, setEditMed] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newMed, setNewMed] = useState({
    name: "",
    dose: "",
    unit: "mg",
    morning: false,
    noon: false,
    evening: false,
    night: false,
  });
  const pMeds = meds.filter((m) => m.patientId === selPat);
  const pat = patients.find((p) => p.id === selPat);
  const saveMed = (id, upd) => {
    setMeds((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              ...upd,
              changed: true,
              changedBy: user.name,
              changedDate: "09/05",
              prevDose: m.dose + m.unit,
            }
          : m,
      ),
    );
    setEditMed(null);
    toast("✅ Medication updated – Counselors will be notified");
  };
  const removeMed = (id) => {
    setMeds((prev) => prev.filter((m) => m.id !== id));
    toast("🗑️ Medication removed");
  };
  const addMed = () => {
    if (!newMed.name || !newMed.dose) {
      toast("⚠️ Please fill Name and Dose");
      return;
    }
    setMeds((prev) => [
      ...prev,
      {
        ...newMed,
        id: "m" + Date.now(),
        patientId: selPat,
        changed: true,
        changedBy: user.name,
        changedDate: "09/05",
        prevDose: "",
      },
    ]);
    setNewMed({
      name: "",
      dose: "",
      unit: "mg",
      morning: false,
      noon: false,
      evening: false,
      night: false,
    });
    setShowAdd(false);
    toast("✅ Medication added – Counselors will be notified");
  };
  return (
    <div>
      {" "}
      <Alrt type="purple" icon="💊">
        {" "}
        Here you can add, edit, and remove Medications per Patient. All changes
        highlighted automatically and notify Counselors.{" "}
      </Alrt>{" "}
      {/* Patient selector */}{" "}
      <Card style={{ marginBottom: 16 }}>
        {" "}
        <CT icon="👤" bg="#e8f0fb">
          Select Patient
        </CT>{" "}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {" "}
          {patients.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelPat(p.id);
                setEditMed(null);
                setShowAdd(false);
              }}
              style={{
                padding: "7px 14px",
                borderRadius: 20,
                border: `2px solid ${selPat === p.id ? C.teal : C.border}`,
                background: selPat === p.id ? C.teal : "#fff",
                color: selPat === p.id ? "#fff" : C.text,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {" "}
              {p.name}{" "}
              <span style={{ marginRight: 6, fontSize: 11, opacity: 0.7 }}>
                ({meds.filter((m) => m.patientId === p.id).length} Medications)
              </span>{" "}
            </button>
          ))}{" "}
        </div>{" "}
      </Card>{" "}
      {selPat && pat && (
        <Card>
          {" "}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            {" "}
            <CT icon="💊" bg="#e8f0fb">
              Medications – {pat.name}
            </CT>{" "}
            <Btn
              color="teal"
              size="sm"
              onClick={() => {
                setShowAdd(true);
                setEditMed(null);
              }}
            >
              + Add Medication
            </Btn>{" "}
          </div>{" "}
          {/* Add form */}{" "}
          {showAdd && (
            <div
              style={{
                background: "#f0fafa",
                borderRadius: 10,
                border: `2px solid ${C.teal}`,
                padding: 14,
                marginBottom: 14,
              }}
            >
              {" "}
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: C.teal,
                  marginBottom: 10,
                }}
              >
                ➕ New Medication
              </div>{" "}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 80px",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                {" "}
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      color: C.soft,
                      display: "block",
                      marginBottom: 3,
                    }}
                  >
                    Medication Name
                  </label>
                  <FI
                    value={newMed.name}
                    onChange={(v) => setNewMed((m) => ({ ...m, name: v }))}
                    placeholder="e.g.: Methadone"
                  />
                </div>{" "}
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      color: C.soft,
                      display: "block",
                      marginBottom: 3,
                    }}
                  >
                    Dose
                  </label>
                  <FI
                    value={newMed.dose}
                    onChange={(v) => setNewMed((m) => ({ ...m, dose: v }))}
                    placeholder="40"
                  />
                </div>{" "}
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      color: C.soft,
                      display: "block",
                      marginBottom: 3,
                    }}
                  >
                    Unit
                  </label>
                  <FS
                    value={newMed.unit}
                    onChange={(v) => setNewMed((m) => ({ ...m, unit: v }))}
                    options={["mg", "mcg", "ml", "IU", "g"]}
                  />
                </div>{" "}
              </div>{" "}
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {" "}
                {["morning", "noon", "evening", "night"].map((k, i) => {
                  const l = ["Morning", "Noon", "Evening", "Night"][i];
                  return (
                    <div
                      key={k}
                      onClick={() => setNewMed((m) => ({ ...m, [k]: !m[k] }))}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 20,
                        border: `2px solid ${newMed[k] ? C.teal : C.border}`,
                        background: newMed[k] ? C.teal : "#fff",
                        color: newMed[k] ? "#fff" : C.soft,
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
                <Btn color="teal" size="sm" onClick={addMed}>
                  ✓ Add
                </Btn>
                <Btn
                  color="outline"
                  size="sm"
                  onClick={() => setShowAdd(false)}
                >
                  Cancel
                </Btn>
              </div>{" "}
            </div>
          )}{" "}
          {pMeds.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: 24,
                color: C.soft,
                fontSize: 13,
              }}
            >
              No medications on record for this patient
            </div>
          )}{" "}
          {pMeds.map((m) => (
            <div key={m.id}>
              {" "}
              {editMed === m.id ? (
                <EditMedRow
                  med={m}
                  onSave={(upd) => saveMed(m.id, upd)}
                  onCancel={() => setEditMed(null)}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "11px 14px",
                    borderRadius: 10,
                    border: `1.5px solid ${m.changed ? C.orange : C.border}`,
                    background: m.changed ? "#fff8f2" : "#fff",
                    marginBottom: 8,
                    gap: 10,
                  }}
                >
                  {" "}
                  <span style={{ fontSize: 18 }}>💊</span>{" "}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {" "}
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      {" "}
                      {m.name}{" "}
                      {m.changed && (
                        <span
                          style={{
                            background: C.orange,
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 8,
                          }}
                        >
                          updated
                        </span>
                      )}{" "}
                    </div>{" "}
                    <div style={{ fontSize: 12, color: C.mid }}>
                      {" "}
                      {m.dose}
                      {m.unit}{" "}
                      {m.changed && m.prevDose && (
                        <span
                          style={{
                            color: C.soft,
                            textDecoration: "line-through",
                            marginRight: 6,
                          }}
                        >
                          {m.prevDose}
                        </span>
                      )}{" "}
                      {m.changed && (
                        <span
                          style={{
                            color: C.orange,
                            fontSize: 11,
                            marginRight: 6,
                          }}
                        >
                          | {m.changedBy} {m.changedDate}
                        </span>
                      )}{" "}
                    </div>{" "}
                  </div>{" "}
                  <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                    {" "}
                    {["Morning", "Noon", "Evening", "Night"].map((t, i) => {
                      const k = ["morning", "noon", "evening", "night"][i];
                      return (
                        <span
                          key={t}
                          style={{
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            background: m[k] ? C.teal : "#f0f2f5",
                            color: m[k] ? "#fff" : "#aaa",
                          }}
                        >
                          {t}
                        </span>
                      );
                    })}{" "}
                  </div>{" "}
                  <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                    {" "}
                    <button
                      onClick={() => {
                        setEditMed(m.id);
                        setShowAdd(false);
                      }}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 7,
                        border: `1.5px solid ${C.border}`,
                        background: "#fff",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        color: C.mid,
                        fontFamily: "inherit",
                      }}
                    >
                      ✏️ Edit
                    </button>{" "}
                    <button
                      onClick={() => removeMed(m.id)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 7,
                        border: "1.5px solid #fcc",
                        background: "#fff5f5",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        color: C.red,
                        fontFamily: "inherit",
                      }}
                    >
                      ✕ Remove
                    </button>{" "}
                  </div>{" "}
                </div>
              )}{" "}
            </div>
          ))}{" "}
        </Card>
      )}{" "}
    </div>
  );
}
