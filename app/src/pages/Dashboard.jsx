import { useState } from "react";
import { C } from "../data/constants";
import { Badge, Card, CT, Alrt, Stat, Th, Td } from "../components/ui";
import useBreakpoint from "../hooks/useBreakpoint";
import PatientProfile from "./PatientProfile";

const patientDays = (p) => p.daysInRehab ?? p.days ?? 0;

export default function Dashboard({
  patients,
  meds,
  consequences,
  therapy,
  groups,
  shifts,
  users,
  phones,
  activeHouse,
  onNav,

  rooms,
  user,
}) {
  const { isMobile } = useBreakpoint();
  const [profilePid, setProfilePid] = useState(null);
  const pending = consequences.filter((c) => c.status === "pending").length;
  const lowMood = patients.filter(
    (p) => p.status === "active" && p.mood <= 3,
  ).length;
  const changed = meds.filter((m) => m.updatedAt && m.updatedAt !== m.createdAt).length;
  const urgentTherapy = therapy.filter(
    (t) => t.urgency === "URGENT",
  ).length; /* Overdue phones */
  const nowTime = new Date().toTimeString().slice(0, 5);
  const overduePhones = phones.filter((ph) => ph.returnBy && nowTime > ph.returnBy);
  const overdueNames = overduePhones
    .map((ph) => patients.find((p) => p.id === ph.patientId)?.name)
    .filter(Boolean); /* Active consequences per patient */
  const activeConsByPat = (pid) =>
    consequences.filter(
      (c) => c.patientId === pid && c.status === "approved",
    ); /* Active shift */
  const activeShift = shifts.find(
    (s) => s.status === "ACTIVE" || (!s.end && s.accepted),
  );
  const shiftCounselor = activeShift
    ? users.find((u) => u.id === activeShift.counselorId)
    : null;
  return (
    <div>
      {" "}
      {profilePid && (
        <PatientProfile
          pid={profilePid}
          patients={patients}
          meds={meds}
          rooms={rooms || []}
          therapy={therapy}
          user={user || { role: "manager", name: "Manager" }}
          canEditMeds={false}
          onClose={() => setProfilePid(null)}
          toast={() => {}}
          consequences={consequences}
          finance={[]}
          onUpdatePatient={() => {}}
          onAddMed={() => {}}
          onSaveMed={() => {}}
          onRemoveMed={() => {}}
        />
      )}{" "}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {" "}
        <Stat
          label="Active Patients"
          value={patients.filter((p) => p.status === "active").length}
          sub={`${patients.filter((p) => p.status === "away").length} outside right now`}
          icon="👥"
          accent={C.blue}
        />{" "}
        <Stat
          label="Changed Medications"
          value={changed}
          sub="Require confirmation"
          icon="💊"
          accent={C.orange}
        />{" "}
        <Stat
          label="Alerts active"
          value={pending + lowMood + urgentTherapy + overduePhones.length}
          sub="Require attention"
          icon="🔔"
          accent={C.red}
        />{" "}
      </div>{" "}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {" "}
        <Card>
          {" "}
          <CT icon="⚠️" bg="#fef3e8">
            Alerts
          </CT>{" "}
          {overduePhones.length > 0 && (
            <Alrt type="red" icon="📱">
              <strong>Phone No Returned!</strong> – {overdueNames.join(", ")}{" "}
              <span
                onClick={() => onNav("phones")}
                style={{ textDecoration: "underline", cursor: "pointer" }}
              >
                to Manage Phones ←
              </span>
            </Alrt>
          )}{" "}
          {lowMood > 0 && (
            <Alrt type="red" icon="😔">
              <strong>Low Emotional Status</strong> –{" "}
              {patients
                .filter((p) => p.mood <= 3 && p.status === "active")
                .map((p) => p.name)
                .join(", ")}
            </Alrt>
          )}{" "}
          {changed > 0 && (
            <Alrt type="orange" icon="💊">
              <strong>{changed} Changed Medications</strong> – Not approved by
              Counselornselor{" "}
              <span
                onClick={() => onNav("medications")}
                style={{ textDecoration: "underline", cursor: "pointer" }}
              >
                Click for Medication Distribution ←
              </span>
            </Alrt>
          )}{" "}
          {urgentTherapy > 0 && (
            <Alrt type="purple" icon="🧠">
              <strong>Urgent from Emotional Therapist</strong> –{" "}
              {therapy
                .filter((t) => t.urgency === "URGENT")
                .map((t) => t.counselorNote || "No note provided")
                .join(", ")}
            </Alrt>
          )}{" "}
          {pending > 0 && (
            <Alrt type="orange" icon="⚠️">
              <strong>{pending} consequences pending approval</strong>{" "}
              <span
                onClick={() => onNav("consequences")}
                style={{ textDecoration: "underline", cursor: "pointer" }}
              >
                approval ←
              </span>
            </Alrt>
          )}{" "}
          {lowMood + changed + urgentTherapy + pending === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: 20,
                color: C.soft,
                fontSize: 13,
              }}
            >
              ✅ No active alerts
            </div>
          )}{" "}
        </Card>{" "}
        <Card>
          {" "}
          <CT icon="🔄" bg="#e3f7f8">
            {" "}
            Active shift{" "}
            {activeHouse && (
              <span
                style={{
                  marginRight: 8,
                  fontSize: 11,
                  color: C.soft,
                  fontWeight: 400,
                }}
              >
                – {activeHouse.name}
              </span>
            )}{" "}
          </CT>{" "}
          {shiftCounselor ? (
            <div
              style={{
                background: `linear-gradient(135deg,${C.teal},${C.tealLt})`,
                borderRadius: 10,
                padding: 16,
                color: "#fff",
                marginBottom: 14,
              }}
            >
              {" "}
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 3 }}>
                On-duty Counselor
              </div>{" "}
              <div style={{ fontSize: 18, fontWeight: 900 }}>
                {shiftCounselor.name}
              </div>{" "}
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {activeShift.start} | Received from: {activeShift.receivedFrom}
              </div>{" "}
            </div>
          ) : (
            <div
              style={{
                background: "#f7f9fc",
                borderRadius: 10,
                padding: 16,
                marginBottom: 14,
                textAlign: "center",
                color: C.soft,
                fontSize: 13,
              }}
            >
              {" "}
              No active shift in {activeHouse?.name || "this House"}{" "}
            </div>
          )}{" "}
          <CT icon="🗓️" bg="#e3f7f8">
            Groups Today
          </CT>{" "}
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <tbody>
              {" "}
              {groups.length > 0
                ? groups.map((g) => (
                    <tr
                      key={g.id}
                      style={{ borderBottom: `1px solid ${C.border}` }}
                    >
                      {" "}
                      <td
                        style={{
                          padding: "7px 10px",
                          color: C.soft,
                          fontSize: 12,
                        }}
                      >
                        {g.time}
                      </td>
                      <td style={{ padding: "7px 10px", fontWeight: 600 }}>
                        {g.topic}
                      </td>
                      <td style={{ padding: "7px 10px" }}>
                        <Badge
                          type={
                            g.status === "done"
                              ? "gray"
                              : g.status === "active"
                                ? "teal"
                                : "blue"
                          }
                        >
                          {g.status === "done"
                            ? "Closed"
                            : g.status === "active"
                              ? "Active"
                              : "planned"}
                        </Badge>
                      </td>
                    </tr>
                  ))
                : [
                    ["09:30", "Morning Reception", "gray", "Closed"],
                    ["14:00", "Skills workshop", "teal", "Active"],
                    ["17:30", "Evening group", "blue", "planned"],
                  ].map(([t, n, c, s]) => (
                    <tr
                      key={t}
                      style={{ borderBottom: `1px solid ${C.border}` }}
                    >
                      {" "}
                      <td
                        style={{
                          padding: "7px 10px",
                          color: C.soft,
                          fontSize: 12,
                        }}
                      >
                        {t}
                      </td>
                      <td style={{ padding: "7px 10px", fontWeight: 600 }}>
                        {n}
                      </td>
                      <td style={{ padding: "7px 10px" }}>
                        <Badge type={c}>{s}</Badge>
                      </td>
                    </tr>
                  ))}{" "}
            </tbody>
          </table>
        </Card>{" "}
      </div>{" "}
      <Card>
        {" "}
        <CT icon="👥" bg="#e8f0fb">
          Status Patients
        </CT>{" "}
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
        >
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Days in Center</Th>
              <Th>Emotional Status</Th>
              <Th>Status</Th>
              <Th>Medications</Th>
            </tr>
          </thead>
          <tbody>
            {" "}
            {[...patients]
              .sort((a, b) => patientDays(b) - patientDays(a))
              .map((p) => {
                const cons = activeConsByPat(p.id);
                return (
                  <tr
                    key={p.id}
                    data-testid="dashboard-status-patient-row"
                    onClick={() => setProfilePid(p.id)}
                    style={{
                      background: p.alert ? "#fff8f2" : "transparent",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f0f4ff")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = p.alert
                        ? "#fff8f2"
                        : "transparent")
                    }
                  >
                    {" "}
                    <Td style={{ fontWeight: 700, color: C.blue }}>
                      {" "}
                      {p.name}{" "}
                      {p.alert && (
                        <span
                          style={{
                            marginRight: 4,
                            fontSize: 9,
                            background: C.red,
                            color: "#fff",
                            padding: "2px 5px",
                            borderRadius: 6,
                          }}
                        >
                          ⚠
                        </span>
                      )}{" "}
                      {cons.length > 0 && (
                        <span
                          style={{
                            marginRight: 4,
                            fontSize: 9,
                            background: C.orange,
                            color: "#fff",
                            padding: "2px 5px",
                            borderRadius: 6,
                          }}
                          title={cons.map((c) => c.description || c.desc).join(", ")}
                        >
                          ⛔ Consequence
                        </span>
                      )}{" "}
                    </Td>{" "}
                    <Td
                      style={{ fontWeight: 900, color: C.teal, fontSize: 15 }}
                    >
                      {patientDays(p)}
                    </Td>{" "}
                    <Td>
                      <Badge
                        type={
                          p.mood >= 7 ? "green" : p.mood >= 4 ? "orange" : "red"
                        }
                      >
                        {p.mood}/10
                      </Badge>
                    </Td>{" "}
                    <Td>
                      {p.status === "away" ? (
                        <Badge type="yellow">🏠 {p.awayType}</Badge>
                      ) : (
                        <Badge type="green">✓ Active</Badge>
                      )}
                    </Td>{" "}
                    <Td>
                      <Badge type="blue">
                        💊 {meds.filter((m) => m.patientId === p.id).length}
                      </Badge>
                      {meds.some((m) => m.patientId === p.id && m.changed) && (
                        <Badge type="orange" style={{ marginRight: 4 }}>
                          Changed
                        </Badge>
                      )}
                    </Td>{" "}
                  </tr>
                );
              })}{" "}
          </tbody>
        </table>
      </Card>{" "}
    </div>
  );
}
