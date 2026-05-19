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
  t = (k) => k,
  dir = "ltr",
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
          t={t}
          dir={dir}
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
          label={t('dashboard.activePatients')}
          value={patients.filter((p) => p.status === "active").length}
          sub={`${patients.filter((p) => p.status === "away").length} ${t('dashboard.activePatientsSub')}`}
          icon="👥"
          accent={C.blue}
        />{" "}
        <Stat
          label={t('dashboard.changedMedications')}
          value={changed}
          sub={t('dashboard.changedMedicationsSub')}
          icon="💊"
          accent={C.orange}
        />{" "}
        <Stat
          label={t('dashboard.alertsActive')}
          value={pending + lowMood + urgentTherapy + overduePhones.length}
          sub={t('dashboard.alertsActiveSub')}
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
            {t('dashboard.alertsTitle')}
          </CT>{" "}
          {overduePhones.length > 0 && (
            <Alrt type="red" icon="📱">
              <strong>{t('dashboard.phoneNoReturned')}</strong> – {overdueNames.join(", ")}{" "}
              <span
                onClick={() => onNav("phones")}
                style={{ textDecoration: "underline", cursor: "pointer" }}
              >
                {t('dashboard.toManagePhones')}
              </span>
            </Alrt>
          )}{" "}
          {lowMood > 0 && (
            <Alrt type="red" icon="😔">
              <strong>{t('dashboard.lowEmotionalStatus')}</strong> –{" "}
              {patients
                .filter((p) => p.mood <= 3 && p.status === "active")
                .map((p) => p.name)
                .join(", ")}
            </Alrt>
          )}{" "}
          {changed > 0 && (
            <Alrt type="orange" icon="💊">
              <strong>{changed} {t('dashboard.changedMedicationsAlert')}</strong> – {t('dashboard.notApprovedByCounselor')}{" "}
              <span
                onClick={() => onNav("medications")}
                style={{ textDecoration: "underline", cursor: "pointer" }}
              >
                {t('dashboard.clickMedicationDistribution')}
              </span>
            </Alrt>
          )}{" "}
          {urgentTherapy > 0 && (
            <Alrt type="purple" icon="🧠">
              <strong>{t('dashboard.urgentFromTherapist')}</strong> –{" "}
              {therapy
                .filter((t) => t.urgency === "URGENT")
                .map((t) => t.counselorNote || "No note provided")
                .join(", ")}
            </Alrt>
          )}{" "}
          {pending > 0 && (
            <Alrt type="orange" icon="⚠️">
              <strong>{pending} {t('dashboard.consequencesPending')}</strong>{" "}
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
              ✅ {t('dashboard.noActiveAlerts')}
            </div>
          )}{" "}
        </Card>{" "}
        <Card>
          {" "}
          <CT icon="🔄" bg="#e3f7f8">
            {" "}
            {t('dashboard.activeShift')}{" "}
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
                {t('dashboard.onDutyCounselor')}
              </div>{" "}
              <div style={{ fontSize: 18, fontWeight: 900 }}>
                {shiftCounselor.name}
              </div>{" "}
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {activeShift.start} | {t('dashboard.receivedFrom')} {activeShift.receivedFrom}
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
              {t('dashboard.noActiveShift')} {activeHouse?.name || "this House"}{" "}
            </div>
          )}{" "}
          <CT icon="🗓️" bg="#e3f7f8">
            {t('dashboard.groupsToday')}
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
                            ? t('dashboard.groupClosed')
                            : g.status === "active"
                              ? t('dashboard.groupActive')
                              : t('dashboard.groupPlanned')}
                        </Badge>
                      </td>
                    </tr>
                  ))
                : [
                    ["09:30", "Morning Reception", "gray", t('dashboard.groupClosed')],
                    ["14:00", "Skills workshop", "teal", t('dashboard.groupActive')],
                    ["17:30", "Evening group", "blue", t('dashboard.groupPlanned')],
                  ].map(([tm, n, c, s]) => (
                    <tr
                      key={tm}
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
                        {tm}
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
          {t('dashboard.statusPatients')}
        </CT>{" "}
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
        >
          <thead>
            <tr>
              <Th>{t('dashboard.tableHeaderName')}</Th>
              <Th>{t('dashboard.tableHeaderDaysInCenter')}</Th>
              <Th>{t('dashboard.tableHeaderEmotionalStatus')}</Th>
              <Th>{t('dashboard.tableHeaderStatus')}</Th>
              <Th>{t('dashboard.tableHeaderMedications')}</Th>
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
                          {t('dashboard.patientChanged')}
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
