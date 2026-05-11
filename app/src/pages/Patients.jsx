import { useState } from "react";
import { C } from "../data/constants";
import { Badge, Card, Btn, Th, Td, Modal, FL, FI, FS, FTA } from "../components/ui";
import PatientProfile from "./PatientProfile";

export default function Patients({
  patients,
  setPatients,
  archived,
  setArchived,
  meds,
  setMeds,
  rooms,
  users,
  therapy,
  user,
  toast,
  initialPatientId,
  consequences,
  finance,
  onAddPatient,
  onArchivePatient,
  onUpdatePatient,
}) {
  const [filter, setFilter] = useState("active");
  const [showAdd, setShowAdd] = useState(false);
  const [showProfile, setShowProfile] = useState(initialPatientId || null);
  const [showDischarge, setShowDischarge] = useState(null);
  const [dischargeType, setDischargeType] = useState("");
  const [newP, setNewP] = useState({
    name: "",
    dob: "",
    idNum: "",
    admitDate: "",
    addiction: "",
    notes: "",
    roomId: "r4",
  });
  const addPatient = async () => {
    if (!newP.name) {
      toast("⚠️ Please fill Name");
      return;
    }
    try {
      await onAddPatient(newP);
      setNewP({ name: "", dob: "", idNum: "", admitDate: "", addiction: "", notes: "", roomId: "" });
      setShowAdd(false);
      toast("✅ Patient added successfully");
    } catch {
      toast("❌ Failed to add patient");
    }
  };
  const discharge = async () => {
    if (!dischargeType) {
      toast("⚠️ Please select a discharge reason");
      return;
    }
    try {
      await onArchivePatient(showDischarge, dischargeType);
      setShowDischarge(null);
      setDischargeType("");
      toast("✅ Treatment completed");
    } catch {
      toast("❌ Failed to discharge patient");
    }
  };
  const canEditMeds = user.role === "manager" || user.role === "doctor";
  const dt = {
    success: { l: "✅ Successful discharge", t: "green" },
    self: { l: "🚪 Self-discharge", t: "orange" },
    escape: { l: "🏃 Escape", t: "red" },
  }; /* Sort by Admission Date oldest first */
  const parseDate = (d) => {
    if (!d) return 0;
    const p = d.split("/");
    return p.length === 3
      ? new Date(`20${p[2]}-${p[1]}-${p[0]}`).getTime() || 0
      : 0;
  };
  const shown = (filter === "active" ? [...patients] : [...archived]).sort(
    (a, b) => parseDate(a.admitDate) - parseDate(b.admitDate),
  );
  return (
    <div>
      {" "}
      {showAdd && (
        <Modal onClose={() => setShowAdd(false)} title="➕ Add New Patient">
          {" "}
          <FL label="Name Full ⭐">
            <FI
              value={newP.name}
              onChange={(v) => setNewP((p) => ({ ...p, name: v }))}
              placeholder="John Doe"
            />
          </FL>{" "}
          <FL label="ID number ⭐">
            <FI
              value={newP.idNum}
              onChange={(v) => setNewP((p) => ({ ...p, idNum: v }))}
              placeholder="000000000"
            />
          </FL>{" "}
          <FL label="Date of Birth">
            <FI
              value={newP.dob}
              onChange={(v) => setNewP((p) => ({ ...p, dob: v }))}
              placeholder="DD/MM/YYYY"
            />
          </FL>{" "}
          <FL label="Date Login">
            <FI
              value={newP.admitDate}
              onChange={(v) => setNewP((p) => ({ ...p, admitDate: v }))}
              placeholder="DD/MM/YYYY (empty = today)"
            />
          </FL>{" "}
          <FL label="Room">
            <FS
              value={newP.roomId}
              onChange={(v) => setNewP((p) => ({ ...p, roomId: v }))}
              options={rooms.map((r) => ({
                v: r.id,
                l: `${r.number} – ${r.building}`,
              }))}
            />
          </FL>{" "}
          <FL label="Addiction Type">
            <FI
              value={newP.addiction}
              onChange={(v) => setNewP((p) => ({ ...p, addiction: v }))}
              placeholder="e.g.: alcohol and gambling"
            />
          </FL>{" "}
          <FL label="Notes">
            <FTA
              value={newP.notes}
              onChange={(v) => setNewP((p) => ({ ...p, notes: v }))}
              placeholder="Relevant info..."
              rows={2}
            />
          </FL>{" "}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Btn color="teal" onClick={addPatient}>
              ✓ Add
            </Btn>
            <Btn color="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Btn>
          </div>{" "}
        </Modal>
      )}{" "}
      {showDischarge && (
        <Modal
          onClose={() => {
            setShowDischarge(null);
            setDischargeType("");
          }}
          title="End Treatment"
        >
          {" "}
          <div style={{ fontSize: 13, color: C.mid, marginBottom: 16 }}>
            {patients.find((p) => p.id === showDischarge)?.name}
          </div>{" "}
          {Object.entries(dt).map(([k, v]) => (
            <div
              key={k}
              onClick={() => setDischargeType(k)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 10,
                border: `2px solid ${dischargeType === k ? C.teal : C.border}`,
                background: dischargeType === k ? "#e3f7f8" : "#fff",
                marginBottom: 8,
                cursor: "pointer",
              }}
            >
              {" "}
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: `2px solid ${dischargeType === k ? C.teal : C.border}`,
                  background: dischargeType === k ? C.teal : "#fff",
                  flexShrink: 0,
                }}
              />{" "}
              <span style={{ fontWeight: 700, fontSize: 13 }}>{v.l}</span>{" "}
            </div>
          ))}{" "}
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <Btn color="red" onClick={discharge}>
              ✓ Confirm Discharge
            </Btn>
            <Btn
              color="outline"
              onClick={() => {
                setShowDischarge(null);
                setDischargeType("");
              }}
            >
              Cancel
            </Btn>
          </div>{" "}
        </Modal>
      )}{" "}
      {showProfile && (
        <PatientProfile
          pid={showProfile}
          patients={patients}
          setPatients={setPatients}
          meds={meds}
          setMeds={setMeds}
          rooms={rooms}
          users={users}
          therapy={therapy}
          user={user}
          canEditMeds={canEditMeds}
          onClose={() => setShowProfile(null)}
          toast={toast}
          consequences={consequences}
          finance={finance}
          onUpdatePatient={onUpdatePatient}
        />
      )}{" "}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 18,
          alignItems: "center",
        }}
      >
        {" "}
        <div
          style={{
            display: "flex",
            gap: 4,
            background: "#f0f2f5",
            borderRadius: 10,
            padding: 4,
          }}
        >
          {" "}
          {[
            ["active", "Active"],
            ["archive", "Archive"],
          ].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                background: filter === v ? "#fff" : "transparent",
                color: filter === v ? C.text : C.soft,
                boxShadow: filter === v ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {" "}
              {l}{" "}
              <span
                style={{
                  background: filter === v ? C.teal : "#ccc",
                  color: "#fff",
                  borderRadius: 10,
                  padding: "1px 7px",
                  fontSize: 10,
                  marginRight: 4,
                }}
              >
                {filter === v
                  ? shown.length
                  : filter === "active"
                    ? archived.length
                    : patients.length}
              </span>{" "}
            </button>
          ))}{" "}
        </div>{" "}
        {user.role === "manager" && (
          <Btn
            color="teal"
            size="sm"
            style={{ marginRight: "auto" }}
            onClick={() => setShowAdd(true)}
          >
            + Add Patient
          </Btn>
        )}{" "}
      </div>{" "}
      <Card style={{ overflowX: "auto" }}>
        {" "}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
            minWidth: 380,
          }}
        >
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Admission</Th>
              <Th>Days in Center</Th>
              {filter === "active" ? (
                <>
                  <Th>Status</Th>
                  {(user.role === "manager" || user.role === "org_manager") && (
                    <Th></Th>
                  )}
                </>
              ) : (
                <>
                  <Th>Discharge Reason</Th>
                  <Th>Date</Th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {" "}
            {shown.map((p) => {
              const hasCons = (consequences || []).some(
                (c) => c.patientId === p.id && c.status === "approved",
              );
              const hasPending = (consequences || []).some(
                (c) => c.patientId === p.id && c.status === "pending",
              );
              return (
                <tr
                  key={p.id}
                  onClick={() => filter === "active" && setShowProfile(p.id)}
                  style={{
                    cursor: filter === "active" ? "pointer" : "default",
                    borderBottom: `1px solid ${C.border}`,
                  }}
                  onMouseEnter={(e) => {
                    if (filter === "active")
                      e.currentTarget.style.background = "#f0f4ff";
                  }}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {" "}
                  <Td
                    style={{
                      fontWeight: 700,
                      color: filter === "active" ? C.blue : C.text,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {" "}
                    {p.name}{" "}
                    {hasCons && (
                      <span
                        style={{
                          marginRight: 5,
                          fontSize: 9,
                          background: C.orange,
                          color: "#fff",
                          padding: "2px 5px",
                          borderRadius: 6,
                        }}
                      >
                        ⛔
                      </span>
                    )}{" "}
                    {hasPending && (
                      <span
                        style={{
                          marginRight: 3,
                          fontSize: 9,
                          background: "#f5c07a",
                          color: "#7a4800",
                          padding: "2px 5px",
                          borderRadius: 6,
                        }}
                      >
                        ⏳
                      </span>
                    )}{" "}
                  </Td>{" "}
                  <Td
                    style={{
                      fontSize: 12,
                      color: C.soft,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.admitDate}
                  </Td>{" "}
                  <Td style={{ fontWeight: 900, color: C.teal, fontSize: 15 }}>
                    {p.days}
                  </Td>{" "}
                  {filter === "active" ? (
                    <>
                      {" "}
                      <Td>
                        {p.status === "away" ? (
                          <Badge type="yellow">🏠 {p.awayType}</Badge>
                        ) : (
                          <Badge type="green">✓ Active</Badge>
                        )}
                      </Td>{" "}
                      {(user.role === "manager" ||
                        user.role === "org_manager") && (
                        <Td onClick={(e) => e.stopPropagation()}>
                          <Btn
                            color="red"
                            size="sm"
                            onClick={() => setShowDischarge(p.id)}
                          >
                            End
                          </Btn>
                        </Td>
                      )}{" "}
                    </>
                  ) : (
                    <>
                      {" "}
                      <Td>
                        {p.dischargeType && (
                          <Badge type={dt[p.dischargeType]?.t || "gray"}>
                            {dt[p.dischargeType]?.l}
                          </Badge>
                        )}
                      </Td>{" "}
                      <Td style={{ fontSize: 12, color: C.soft }}>
                        {p.dischargeDate}
                      </Td>{" "}
                    </>
                  )}{" "}
                </tr>
              );
            })}{" "}
          </tbody>
        </table>
      </Card>{" "}
    </div>
  );
}
