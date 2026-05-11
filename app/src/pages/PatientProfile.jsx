import { useState } from "react";
import { C } from "../data/constants";
import { Badge, Card, CT, Alrt, Btn, Modal, FL, FI, FS } from "../components/ui";
import EditMedRow from "./EditMedRow";

export default function PatientProfile({
  pid,
  patients,
  setPatients,
  meds,
  setMeds,
  rooms,
  users,
  therapy,
  user,
  canEditMeds,
  onClose,
  toast,
  consequences,
  finance,
}) {
  const p = patients.find((pt) => pt.id === pid);
  const [tab, setTab] = useState("meds");
  const [editMed, setEditMed] = useState(null);
  const [showAddMed, setShowAddMed] = useState(false);
  const [newMed, setNewMed] = useState({
    name: "",
    dose: "",
    unit: "mg",
    morning: false,
    noon: false,
    evening: false,
    night: false,
  }); /* absence */
  const [showAbsence, setShowAbsence] = useState(false);
  const [absData, setAbsData] = useState({
    type: "Home Visit",
    returnDate: "",
  });
  const canManageAbsencece =
    user.role === "manager" || user.role === "counselor";
  const canRequestAbsence =
    user.role === "counselor" || user.role === "manager";
  const INIT_ABS_HIST = [
    {
      id: "ah1",
      type: "Home Visit",
      start: "15/04/2025",
      end: "17/04/2025",
      approvedBy: "Jonathan Barak",
      status: "returned",
    },
    {
      id: "ah2",
      type: "Errands",
      start: "28/04/2025",
      end: "28/04/2025",
      approvedBy: "Jonathan Barak",
      status: "returned",
    },
  ];
  const room = rooms.find((r) => r.id === p?.roomId);
  const pMeds = meds.filter((m) => m.patientId === pid);
  const pTherapy = therapy.filter((t) => t.patientId === pid);
  if (!p) return null;
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
    toast("Medication removed");
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
        patientId: pid,
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
    setShowAddMed(false);
    toast("✅ Medication added");
  };
  const openAbsence = () => {
    if (!absData.returnDate) {
      toast("⚠️ Please enter expected return date");
      return;
    }
    setPatients((prev) =>
      prev.map((pt) =>
        pt.id === pid ? { ...pt, status: "away", awayType: absData.type } : pt,
      ),
    );
    setShowAbsence(false);
    toast(
      `✅ ${p.name} left for ${absData.type} – back on ${absData.returnDate}`,
    );
  };
  const returnPatient = () => {
    setPatients((prev) =>
      prev.map((pt) =>
        pt.id === pid ? { ...pt, status: "active", awayType: null } : pt,
      ),
    );
    toast(`✅ ${p.name} returned to center`);
  };
  const moods = [8, 7, 9, 8, 7, 8, p.mood];
  const days = ["3/5", "4/5", "5/5", "6/5", "7/5", "8/5", "9/5"];
  return (
    <Modal onClose={onClose} title="" width={600}>
      {" "}
      {showAbsence && (
        <Modal
          onClose={() => setShowAbsence(false)}
          title="🏠 Confirm Logout"
          width={380}
        >
          {" "}
          {!canManageAbsencece && (
            <Alrt type="teal" icon="ℹ️">
              Absence will be recorded and visible to manager
            </Alrt>
          )}{" "}
          <FL label="Type Logout">
            {" "}
            <div style={{ display: "flex", gap: 10 }}>
              {" "}
              {["Home Visit", "Errands", "Therapy Medical", "Other"].map(
                (t) => (
                  <div
                    key={t}
                    onClick={() => setAbsData((d) => ({ ...d, type: t }))}
                    style={{
                      flex: 1,
                      padding: "8px 6px",
                      borderRadius: 10,
                      border: `2px solid ${absData.type === t ? C.teal : C.border}`,
                      background: absData.type === t ? "#e3f7f8" : "#fff",
                      textAlign: "center",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 700,
                      color: absData.type === t ? C.teal : C.mid,
                    }}
                  >
                    {t}
                  </div>
                ),
              )}{" "}
            </div>{" "}
          </FL>{" "}
          <FL label="Date Return Expected">
            <FI
              value={absData.returnDate}
              onChange={(v) => setAbsData((d) => ({ ...d, returnDate: v }))}
              placeholder="DD/MM/YYYY"
            />
          </FL>{" "}
          <div
            style={{
              background: "#fff8f0",
              border: `1px solid #f5c07a`,
              borderRadius: 8,
              padding: "9px 12px",
              fontSize: 12,
              color: "#8b4800",
              marginBottom: 14,
            }}
          >
            {" "}
            ⚠️ During absence: Patient will NOT appear in Medication
            Distribution, Groups and Phones. Will appear in Daily Summary.{" "}
          </div>{" "}
          <div style={{ display: "flex", gap: 10 }}>
            {" "}
            <Btn color="teal" onClick={openAbsence}>
              ✓ Mark Absence
            </Btn>{" "}
            <Btn color="outline" onClick={() => setShowAbsence(false)}>
              Cancel
            </Btn>{" "}
          </div>{" "}
        </Modal>
      )}{" "}
      {/* Header */}{" "}
      <div
        style={{
          background: `linear-gradient(135deg,${C.navy},${C.navyMid})`,
          borderRadius: 12,
          padding: 20,
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 18,
          color: "#fff",
        }}
      >
        {" "}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: `linear-gradient(135deg,${C.teal},${C.blueLt})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 900,
            flexShrink: 0,
          }}
        >
          {p.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)}
        </div>{" "}
        <div style={{ flex: 1 }}>
          {" "}
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 3 }}>
            {p.name}
          </div>{" "}
          <div style={{ fontSize: 12, opacity: 0.65 }}>
            {p.dob && `${p.dob} | `}
            {room ? `${room.number} – ${room.building}` : "—"}
            {p.idNum && ` | ID: ${p.idNum}`}
          </div>{" "}
          <div
            style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}
          >
            {" "}
            <Badge type="teal">💊 {pMeds.length} Medications</Badge>{" "}
            <Badge type={p.status === "away" ? "yellow" : "green"}>
              {p.status === "away" ? `🏠 ${p.awayType}` : "✓ Active"}
            </Badge>{" "}
            {p.addiction && <Badge type="purple">🔴 {p.addiction}</Badge>}{" "}
          </div>{" "}
        </div>{" "}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            alignItems: "center",
          }}
        >
          {" "}
          <div
            style={{
              textAlign: "center",
              background: "rgba(255,255,255,0.1)",
              borderRadius: 10,
              padding: "10px 16px",
            }}
          >
            {" "}
            <div
              style={{
                fontSize: 30,
                fontWeight: 900,
                color: "#5dffd5",
                lineHeight: 1,
              }}
            >
              {p.days}
            </div>{" "}
            <div style={{ fontSize: 11, opacity: 0.6 }}>
              Days in Center
            </div>{" "}
          </div>{" "}
          {p.status === "active" && canRequestAbsence && (
            <button
              onClick={() => setShowAbsence(true)}
              style={{
                background: "rgba(255,165,0,0.2)",
                border: "1px solid rgba(255,165,0,0.5)",
                color: "#ffd080",
                borderRadius: 8,
                padding: "5px 10px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {" "}
              🏠 Send on visit{" "}
            </button>
          )}{" "}
          {p.status === "away" && canManageAbsencece && (
            <button
              onClick={returnPatient}
              style={{
                background: "rgba(39,174,96,0.2)",
                border: "1px solid rgba(39,174,96,0.5)",
                color: "#5dffd5",
                borderRadius: 8,
                padding: "5px 10px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {" "}
              ✓ Confirm Return{" "}
            </button>
          )}{" "}
        </div>{" "}
      </div>{" "}
      {/* Tabs */}{" "}
      <div
        style={{
          display: "flex",
          gap: 3,
          marginBottom: 16,
          borderBottom: `2px solid ${C.border}`,
          overflowX: "auto",
        }}
      >
        {" "}
        {[
          ["meds", "💊 Medications"],
          ["absence", "🏠 Absences"],
          ["cons", "⛔ Consequences"],
          ["finance", "💰 General"],
          ["moods", "😊 Indicators"],
          ["therapy", "🧠 Emotional Therapy"],
          ["notes", "📝 Notes"],
        ].map(([id, l]) => (
          <div
            key={id}
            onClick={() => setTab(id)}
            style={{
              padding: "7px 12px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              color: tab === id ? C.blue : C.soft,
              borderBottom: `2px solid ${tab === id ? C.blue : "transparent"}`,
              marginBottom: -2,
              whiteSpace: "nowrap",
            }}
          >
            {l}
          </div>
        ))}{" "}
      </div>{" "}
      {/* MEDS TAB */}{" "}
      {tab === "meds" && (
        <div>
          {" "}
          {canEditMeds && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 10,
              }}
            >
              <Btn color="teal" size="sm" onClick={() => setShowAddMed(true)}>
                + Add Medication
              </Btn>
            </div>
          )}{" "}
          {showAddMed && (
            <div
              style={{
                background: "#f0fafa",
                borderRadius: 10,
                border: `2px solid ${C.teal}`,
                padding: 14,
                marginBottom: 10,
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
                  value={newMed.name}
                  onChange={(v) => setNewMed((m) => ({ ...m, name: v }))}
                  placeholder="Medication Name"
                />{" "}
                <FI
                  value={newMed.dose}
                  onChange={(v) => setNewMed((m) => ({ ...m, dose: v }))}
                  placeholder="Dose"
                />{" "}
                <FS
                  value={newMed.unit}
                  onChange={(v) => setNewMed((m) => ({ ...m, unit: v }))}
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
                      onClick={() => setNewMed((m) => ({ ...m, [k]: !m[k] }))}
                      style={{
                        padding: "5px 12px",
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
                  onClick={() => setShowAddMed(false)}
                >
                  Cancel
                </Btn>
              </div>{" "}
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
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1.5px solid ${m.changed ? C.orange : C.border}`,
                    background: m.changed ? "#fff8f2" : "#fff",
                    marginBottom: 8,
                    gap: 10,
                  }}
                >
                  {" "}
                  <span style={{ fontSize: 18 }}>💊</span>{" "}
                  <div style={{ flex: 1 }}>
                    {" "}
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {m.name}
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
                      )}
                    </div>{" "}
                    <div style={{ fontSize: 12, color: C.mid }}>
                      {m.dose}
                      {m.unit}
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
                      )}
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
                      )}
                    </div>{" "}
                  </div>{" "}
                  <div style={{ display: "flex", gap: 5 }}>
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
                  {canEditMeds && (
                    <div style={{ display: "flex", gap: 5, marginRight: 4 }}>
                      <button
                        onClick={() => setEditMed(m.id)}
                        style={{
                          padding: "3px 8px",
                          borderRadius: 7,
                          border: `1.5px solid ${C.border}`,
                          background: "#fff",
                          cursor: "pointer",
                          fontSize: 11,
                          fontWeight: 700,
                          color: C.mid,
                          fontFamily: "inherit",
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => removeMed(m.id)}
                        style={{
                          padding: "3px 8px",
                          borderRadius: 7,
                          border: "1.5px solid #fcc",
                          background: "#fff5f5",
                          cursor: "pointer",
                          fontSize: 11,
                          fontWeight: 700,
                          color: C.red,
                          fontFamily: "inherit",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}{" "}
                </div>
              )}{" "}
            </div>
          ))}{" "}
        </div>
      )}{" "}
      {/* CONSEQUENCES TAB */}{" "}
      {tab === "cons" && (
        <div>
          {" "}
          {(() => {
            const pCons = (consequences || []).filter(
              (c) => c.patientId === pid,
            );
            const typeLabels = {
              phone: "📵 Phone Restriction",
              visit: "🏠 Cancel Home Visit",
              cigarettes: "🚬 Cigarette Restriction",
              other: "📝 Other",
            };
            if (pCons.length === 0)
              return (
                <div
                  style={{
                    textAlign: "center",
                    padding: 20,
                    color: C.soft,
                    fontSize: 13,
                  }}
                >
                  No records found
                </div>
              );
            return pCons.map((c) => (
              <div
                key={c.id}
                style={{
                  borderRadius: 10,
                  border: `1.5px solid ${c.status === "approved" ? C.orange : c.status === "pending" ? "#f5c07a" : C.border}`,
                  padding: 14,
                  marginBottom: 10,
                  background:
                    c.status === "approved"
                      ? "#fff8f0"
                      : c.status === "pending"
                        ? "#fffbf0"
                        : "#f9f9f9",
                }}
              >
                {" "}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 5,
                    alignItems: "center",
                  }}
                >
                  {" "}
                  <span style={{ fontWeight: 800, fontSize: 13 }}>
                    {typeLabels[c.type] || c.type}
                  </span>{" "}
                  <Badge
                    type={
                      c.status === "approved"
                        ? "orange"
                        : c.status === "pending"
                          ? "yellow"
                          : "gray"
                    }
                  >
                    {c.status === "approved"
                      ? "⛔ Active"
                      : c.status === "pending"
                        ? "⏳ Pending"
                        : "Cancelled"}
                  </Badge>{" "}
                </div>{" "}
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>
                  {c.desc}
                </div>{" "}
                <div style={{ fontSize: 11, color: C.soft }}>
                  Reason: {c.reason} | {c.createdAt}
                </div>{" "}
              </div>
            ));
          })()}{" "}
        </div>
      )}{" "}
      {/* FINANCE TAB */}{" "}
      {tab === "finance" && (
        <div>
          {" "}
          {(() => {
            const pFin = (finance || [])
              .filter((f) => f.patientId === pid)
              .sort((a, b) => b.id.localeCompare(a.id));
            const balance = pFin.reduce(
              (sum, f) =>
                f.type === "deposit" ? sum + f.amount : sum - f.amount,
              0,
            );
            return (
              <>
                {" "}
                <div
                  style={{
                    background: `linear-gradient(135deg,${C.teal},${C.tealLt})`,
                    borderRadius: 12,
                    padding: 16,
                    color: "#fff",
                    marginBottom: 14,
                    textAlign: "center",
                  }}
                >
                  {" "}
                  <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 4 }}>
                    Account Balance
                  </div>{" "}
                  <div style={{ fontSize: 32, fontWeight: 900 }}>
                    ₪{balance.toLocaleString()}
                  </div>{" "}
                </div>{" "}
                {pFin.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 16,
                      color: C.soft,
                      fontSize: 13,
                    }}
                  >
                    No financial transactions
                  </div>
                ) : (
                  pFin.map((f) => (
                    <div
                      key={f.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "9px 0",
                        borderBottom: `1px solid ${C.border}`,
                        gap: 10,
                      }}
                    >
                      {" "}
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background:
                            f.type === "deposit" ? "#e8f8ef" : "#fce8e8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 900,
                          color: f.type === "deposit" ? C.green : C.red,
                          flexShrink: 0,
                        }}
                      >
                        {f.type === "deposit" ? "↑" : "↓"}
                      </div>{" "}
                      <div style={{ flex: 1 }}>
                        {" "}
                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                          {f.note || f.cat}
                        </div>{" "}
                        <div style={{ fontSize: 11, color: C.soft }}>
                          {f.date} | {f.cat}
                        </div>{" "}
                      </div>{" "}
                      <div
                        style={{
                          fontWeight: 800,
                          color: f.type === "deposit" ? C.green : C.red,
                        }}
                      >
                        {f.type === "deposit" ? "+" : "-"}₪{f.amount}
                      </div>{" "}
                    </div>
                  ))
                )}{" "}
              </>
            );
          })()}{" "}
        </div>
      )}{" "}
      {/* MOODS TAB */}{" "}
      {tab === "moods" && (
        <div>
          {" "}
          <Card>
            {" "}
            <CT icon="😊" bg="#fef3e8">
              Emotional Status – 7 days
            </CT>{" "}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 8,
                height: 100,
                padding: "0 8px",
                marginBottom: 8,
              }}
            >
              {" "}
              {moods.map((v, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {" "}
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.teal }}>
                    {v}
                  </div>{" "}
                  <div
                    style={{
                      background: i === 6 ? C.blueLt : v <= 3 ? C.red : C.teal,
                      borderRadius: "4px 4px 0 0",
                      width: "100%",
                      height: v * 9,
                    }}
                  />{" "}
                  <div style={{ fontSize: 10, color: C.soft }}>
                    {days[i]}
                  </div>{" "}
                </div>
              ))}{" "}
            </div>{" "}
          </Card>{" "}
        </div>
      )}{" "}
      {/* THERAPY TAB */}{" "}
      {tab === "therapy" && (
        <div>
          {" "}
          {pTherapy.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 20,
                color: C.soft,
                fontSize: 13,
              }}
            >
              No scheduled sessions
            </div>
          ) : (
            pTherapy.map((t) => (
              <div
                key={t.id}
                style={{
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  padding: 14,
                  marginBottom: 10,
                }}
              >
                {" "}
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  {" "}
                  <span style={{ fontSize: 14 }}>🧠</span>{" "}
                  <div style={{ flex: 1 }}>
                    {" "}
                    <div style={{ fontWeight: 700, fontSize: 13 }}>
                      {t.topic}
                    </div>{" "}
                    <div style={{ fontSize: 12, color: C.soft }}>
                      {t.date}
                    </div>{" "}
                  </div>{" "}
                  <Badge
                    type={
                      { NORMAL: "teal", ATTENTION: "orange", URGENT: "red" }[
                        t.urgency
                      ]
                    }
                  >
                    {
                      {
                        NORMAL: "Normal",
                        ATTENTION: "Attention",
                        URGENT: "Urgent",
                      }[t.urgency]
                    }
                  </Badge>{" "}
                </div>{" "}
                {t.counselorNote && (
                  <div
                    style={{
                      background: "#e3f7f8",
                      border: "1px solid #7dd4d7",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 12,
                      color: "#054548",
                    }}
                  >
                    💬 Note for Counselors: {t.counselorNote}
                  </div>
                )}{" "}
                {(user.role === "manager" || user.role === "therapist") &&
                  t.notes && (
                    <div
                      style={{
                        background: "#f0e8fb",
                        border: `1px solid #c9a8f0`,
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontSize: 12,
                        color: "#3d1a6b",
                        marginTop: 6,
                      }}
                    >
                      🔒 {t.notes}
                    </div>
                  )}{" "}
              </div>
            ))
          )}{" "}
        </div>
      )}{" "}
      {/* NOTES TAB */}{" "}
      {tab === "notes" && (
        <div>
          {" "}
          {[
            [
              "09/05/2025",
              "Amir Menachem",
              C.blue,
              "Good day. Participated actively. Emotional Status 8/10.",
            ],
            [
              "08/05/2025",
              "Miriam Saad",
              C.teal,
              "Slight delay – was on a phone call with mom.",
            ],
          ].map(([d, by, col, n]) => (
            <div
              key={d}
              style={{
                borderRight: `3px solid ${col}`,
                paddingRight: 12,
                marginBottom: 14,
              }}
            >
              {" "}
              <div style={{ fontSize: 11, color: C.soft, marginBottom: 2 }}>
                {d} | {by}
              </div>{" "}
              <div style={{ fontSize: 13 }}>{n}</div>{" "}
            </div>
          ))}{" "}
        </div>
      )}{" "}
      {/* ABSENCE TAB */}{" "}
      {tab === "absence" && (
        <div>
          {" "}
          {/* Current status */}{" "}
          {p.status === "away" ? (
            <div
              style={{
                background: `linear-gradient(135deg,${C.orange},${C.orange}cc)`,
                borderRadius: 12,
                padding: 18,
                color: "#fff",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              {" "}
              <div style={{ fontSize: 36 }}>🏠</div>{" "}
              <div style={{ flex: 1 }}>
                {" "}
                <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 3 }}>
                  {p.awayType}
                </div>{" "}
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  Patient is outside center right now
                </div>{" "}
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
                  Not shown in Medications / Groups / Phones
                </div>{" "}
              </div>{" "}
              {canManageAbsencece && (
                <button
                  onClick={returnPatient}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.4)",
                    color: "#fff",
                    borderRadius: 10,
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  ✓ Confirm Return
                </button>
              )}{" "}
            </div>
          ) : (
            <div
              style={{
                background: "#e8f8ef",
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              {" "}
              <span style={{ fontSize: 22 }}>✅</span>{" "}
              <div
                style={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.green,
                }}
              >
                Patient is in Center
              </div>{" "}
              {canRequestAbsence && (
                <Btn
                  color="orange"
                  size="sm"
                  onClick={() => setShowAbsence(true)}
                >
                  🏠 Send on visit
                </Btn>
              )}{" "}
            </div>
          )}{" "}
          <Card>
            {" "}
            <CT icon="📋" bg="#fef3e8">
              History of Absences
            </CT>{" "}
            {[
              ...INIT_ABS_HIST,
              p.status === "away"
                ? {
                    id: "current",
                    type: p.awayType,
                    start: "09/05/2025",
                    end: "—",
                    approvedBy: "—",
                    status: "active",
                  }
                : null,
            ]
              .filter(Boolean)
              .reverse()
              .map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 0",
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  {" "}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background:
                        a.status === "active"
                          ? `linear-gradient(135deg,${C.orange},#e07b39)`
                          : "#f0f2f5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    {" "}
                    {a.type === "Home Visit"
                      ? "🏠"
                      : a.type === "Errands"
                        ? "🛒"
                        : "🚗"}{" "}
                  </div>{" "}
                  <div style={{ flex: 1 }}>
                    {" "}
                    <div style={{ fontWeight: 700, fontSize: 13 }}>
                      {a.type}
                    </div>{" "}
                    <div style={{ fontSize: 12, color: C.soft }}>
                      {a.start} → Return: {a.end}
                    </div>{" "}
                    {a.approvedBy && a.approvedBy !== "—" && (
                      <div style={{ fontSize: 11, color: C.soft }}>
                        Approved by: {a.approvedBy}
                      </div>
                    )}{" "}
                  </div>{" "}
                  <Badge type={a.status === "active" ? "orange" : "green"}>
                    {a.status === "active" ? "🏠 outside" : "✓ Returned"}
                  </Badge>{" "}
                </div>
              ))}{" "}
            {!canManageAbsencece && p.status === "active" && (
              <div
                style={{
                  marginTop: 12,
                  background: "#fff8f0",
                  border: `1px solid #f5c07a`,
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 13,
                  color: "#8b4800",
                }}
              >
                {" "}
                💡 As Counselor, send Absence Request – the manager will
                approve.{" "}
                <div style={{ marginTop: 8 }}>
                  <Btn
                    color="orange"
                    size="sm"
                    onClick={() => setShowAbsence(true)}
                  >
                    📤 Send Absence Request
                  </Btn>
                </div>{" "}
              </div>
            )}{" "}
          </Card>{" "}
        </div>
      )}{" "}
      {/* MOODS TAB */}{" "}
      {tab === "moods" && (
        <div>
          {" "}
          <Card>
            {" "}
            <CT icon="😊" bg="#fef3e8">
              Emotional Status – 7 days
            </CT>{" "}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 8,
                height: 100,
                padding: "0 8px",
                marginBottom: 8,
              }}
            >
              {" "}
              {moods.map((v, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {" "}
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.teal }}>
                    {v}
                  </div>{" "}
                  <div
                    style={{
                      background: i === 6 ? C.blueLt : v <= 3 ? C.red : C.teal,
                      borderRadius: "4px 4px 0 0",
                      width: "100%",
                      height: v * 9,
                    }}
                  />{" "}
                  <div style={{ fontSize: 10, color: C.soft }}>
                    {days[i]}
                  </div>{" "}
                </div>
              ))}{" "}
            </div>{" "}
          </Card>{" "}
        </div>
      )}{" "}
      {/* THERAPY TAB */}{" "}
      {tab === "therapy" && (
        <div>
          {" "}
          {pTherapy.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 20,
                color: C.soft,
                fontSize: 13,
              }}
            >
              No scheduled sessions
            </div>
          ) : (
            pTherapy.map((t) => (
              <div
                key={t.id}
                style={{
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  padding: 14,
                  marginBottom: 10,
                }}
              >
                {" "}
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  {" "}
                  <span style={{ fontSize: 14 }}>🧠</span>{" "}
                  <div style={{ flex: 1 }}>
                    {" "}
                    <div style={{ fontWeight: 700, fontSize: 13 }}>
                      {t.topic}
                    </div>{" "}
                    <div style={{ fontSize: 12, color: C.soft }}>
                      {t.date}
                    </div>{" "}
                  </div>{" "}
                  <Badge
                    type={
                      { NORMAL: "teal", ATTENTION: "orange", URGENT: "red" }[
                        t.urgency
                      ]
                    }
                  >
                    {
                      {
                        NORMAL: "Normal",
                        ATTENTION: "Attention",
                        URGENT: "Urgent",
                      }[t.urgency]
                    }
                  </Badge>{" "}
                </div>{" "}
                {t.counselorNote && (
                  <div
                    style={{
                      background: "#e3f7f8",
                      border: "1px solid #7dd4d7",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 12,
                      color: "#054548",
                    }}
                  >
                    💬 Note for Counselors: {t.counselorNote}
                  </div>
                )}{" "}
                {(user.role === "manager" || user.role === "therapist") &&
                  t.notes && (
                    <div
                      style={{
                        background: "#f0e8fb",
                        border: `1px solid #c9a8f0`,
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontSize: 12,
                        color: "#3d1a6b",
                        marginTop: 6,
                      }}
                    >
                      🔒 {t.notes}
                    </div>
                  )}{" "}
              </div>
            ))
          )}{" "}
        </div>
      )}{" "}
      {/* NOTES TAB */}{" "}
      {tab === "notes" && (
        <div>
          {" "}
          <Card style={{ marginBottom: 12 }}>
            {" "}
            <CT icon="📋" bg="#e8f0fb">
              details Patient
            </CT>{" "}
            {[
              ["👤 Name Full", p.name],
              ["🪪 ID number", p.idNum || "—"],
              ["🎂 Date of Birth", p.dob || "—"],
              ["📅 Date Login", p.admitDate],
              ["🔴 Addiction Type", p.addiction || "Not specified"],
            ].map(([l, v]) => (
              <div
                key={l}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "7px 0",
                  borderBottom: `1px solid ${C.border}`,
                  fontSize: 13,
                }}
              >
                {" "}
                <span style={{ color: C.soft }}>{l}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>{" "}
              </div>
            ))}{" "}
            {p.notes && (
              <div
                style={{
                  marginTop: 10,
                  background: "#f7f9fc",
                  borderRadius: 8,
                  padding: "9px 12px",
                  fontSize: 13,
                  color: C.mid,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 11,
                    color: C.soft,
                    marginBottom: 4,
                  }}
                >
                  📝 Notes
                </div>
                {p.notes}
              </div>
            )}{" "}
          </Card>{" "}
          {[
            [
              "09/05/2025",
              "Amir Menachem",
              C.blue,
              "Good day. Participated actively. Emotional Status 8/10.",
            ],
            [
              "08/05/2025",
              "Miriam Saad",
              C.teal,
              "Slight delay – was on a phone call with mom.",
            ],
          ].map(([d, by, col, n]) => (
            <div
              key={d}
              style={{
                borderRight: `3px solid ${col}`,
                paddingRight: 12,
                marginBottom: 14,
              }}
            >
              {" "}
              <div style={{ fontSize: 11, color: C.soft, marginBottom: 2 }}>
                {d} | {by}
              </div>{" "}
              <div style={{ fontSize: 13 }}>{n}</div>{" "}
            </div>
          ))}{" "}
        </div>
      )}{" "}
    </Modal>
  );
}
