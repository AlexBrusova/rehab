import { useState } from "react";
import { C } from "../data/constants";
import { V } from "../data/validationLimits";
import {
  sanitizeNationalIdDigits,
  isValidDateDdMmYyyy,
  sanitizeFreeText,
} from "../lib/inputSanitize";
import {
  patientNameRules,
  dateDdMmRules,
  dateDdMmOptionalRules,
} from "../lib/fieldRules";
import { Badge, Card, Btn, Th, Td, Modal, FL, FI, FS, FTA } from "../components/ui";
import PatientProfile from "./PatientProfile";

export default function Patients({
  patients,
  archived,
  meds,
  rooms,
  users,
  therapy,
  user,
  toast,
  initialPatientId,
  consequences,
  finance,
  vitals,
  onAddVital,
  onAddSession,
  onAddPatient,
  onArchivePatient,
  onUpdatePatient,
  onMarkAway = () => {},
  onAddMed,
  onSaveMed,
  onRemoveMed,
  t = (k) => k,
  dir = "ltr",
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
    roomId: "",
  });
  const addPatient = async () => {
    if (!newP.name?.trim()) {
      toast(t('patients.toastNameRequired'));
      return;
    }
    if (!newP.dob?.trim()) {
      toast(t('patients.toastDOBRequired'));
      return;
    }
    if (!isValidDateDdMmYyyy(newP.dob.trim())) {
      toast(t('patients.toastDOBInvalid'));
      return;
    }
    const admitRaw = newP.admitDate?.trim();
    const admitDate =
      admitRaw || new Date().toLocaleDateString("en-GB");
    if (admitRaw && !isValidDateDdMmYyyy(admitRaw)) {
      toast(t('patients.toastAdmitDateInvalid'));
      return;
    }
    try {
      await onAddPatient({ ...newP, admitDate });
      setNewP({
        name: "",
        dob: "",
        idNum: "",
        admitDate: "",
        addiction: "",
        notes: "",
        roomId: rooms[0]?.id || "",
      });
      setShowAdd(false);
      toast(t('patients.toastAddSuccess'));
    } catch {
      toast(t('patients.toastAddFailed'));
    }
  };
  const discharge = async () => {
    if (!dischargeType) {
      toast(t('patients.toastDischargeReasonRequired'));
      return;
    }
    try {
      await onArchivePatient(showDischarge, dischargeType);
      setShowDischarge(null);
      setDischargeType("");
      toast(t('patients.toastDischargeSuccess'));
    } catch {
      toast(t('patients.toastDischargeFailed'));
    }
  };
  const canEditMeds = user.role === "manager" || user.role === "doctor";
  const dt = {
    success: { l: t('patients.successDischargeLongLabel'), t: "green" },
    self: { l: t('patients.selfDischargeLongLabel'), t: "orange" },
    escape: { l: t('patients.escapeLongLabel'), t: "red" },
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
        <Modal onClose={() => setShowAdd(false)} title={t('patients.addNewPatientTitle')}>
          {" "}
          <FL label={t('patients.nameLabelFull')}>
            <FI
              dir={dir}
              value={newP.name}
              onChange={(v) => setNewP((p) => ({ ...p, name: v }))}
              {...patientNameRules}
              placeholder={t('patients.namePlaceholder')}
            />
          </FL>{" "}
          <FL label={t('patients.idNumberLabel')}>
            <FI
              dir={dir}
              value={newP.idNum}
              onChange={(v) => setNewP((p) => ({ ...p, idNum: v }))}
              sanitize={sanitizeNationalIdDigits}
              maxLength={9}
              inputMode="numeric"
              placeholder={t('patients.idNumberPlaceholder')}
              title={t('patients.idNumberTitle')}
            />
          </FL>{" "}
          <FL label={t('patients.dateOfBirthLabel')}>
            <FI
              dir={dir}
              value={newP.dob}
              onChange={(v) => setNewP((p) => ({ ...p, dob: v }))}
              {...dateDdMmRules}
              placeholder={t('patients.dateOfBirthPlaceholder')}
            />
          </FL>{" "}
          <FL label={t('patients.dateLoginLabel')}>
            <FI
              dir={dir}
              value={newP.admitDate}
              onChange={(v) => setNewP((p) => ({ ...p, admitDate: v }))}
              {...dateDdMmOptionalRules}
              placeholder={t('patients.dateLoginPlaceholder')}
            />
          </FL>{" "}
          <FL label={t('patients.roomLabel')}>
            <FS
              dir={dir}
              value={newP.roomId}
              onChange={(v) => setNewP((p) => ({ ...p, roomId: v }))}
              options={rooms.map((r) => ({
                v: r.id,
                l: `${r.number} – ${r.building}`,
              }))}
            />
          </FL>{" "}
          <FL label={t('patients.addictionTypeLabel')}>
            <FI
              dir={dir}
              value={newP.addiction}
              onChange={(v) => setNewP((p) => ({ ...p, addiction: v }))}
              sanitize={(s) => sanitizeFreeText(s, V.SHORT_LABEL)}
              maxLength={V.SHORT_LABEL}
              placeholder={t('patients.addictionTypePlaceholder')}
            />
          </FL>{" "}
          <FL label={t('patients.notesLabel')}>
            <FTA
              dir={dir}
              value={newP.notes}
              onChange={(v) => setNewP((p) => ({ ...p, notes: v }))}
              sanitize={(s) => sanitizeFreeText(s, V.NOTE_MAX)}
              maxLength={V.NOTE_MAX}
              placeholder={t('patients.notesPlaceholder')}
              rows={2}
            />
          </FL>{" "}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Btn color="teal" onClick={addPatient}>
              {t('patients.addButton')}
            </Btn>
            <Btn color="outline" onClick={() => setShowAdd(false)}>
              {t('patients.cancelButton')}
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
          title={t('patients.endTreatmentTitle')}
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
              {t('patients.confirmDischargeButton')}
            </Btn>
            <Btn
              color="outline"
              onClick={() => {
                setShowDischarge(null);
                setDischargeType("");
              }}
            >
              {t('patients.cancelButton')}
            </Btn>
          </div>{" "}
        </Modal>
      )}{" "}
      {showProfile && (
        <PatientProfile
          pid={showProfile}
          patients={patients}
          meds={meds}
          rooms={rooms}
          users={users}
          therapy={therapy}
          user={user}
          canEditMeds={canEditMeds}
          onClose={() => setShowProfile(null)}
          toast={toast}
          consequences={consequences}
          finance={finance}
          vitals={vitals}
          onAddVital={onAddVital}
          onAddSession={onAddSession}
          onUpdatePatient={onUpdatePatient}
          onMarkAway={onMarkAway}
          onAddMed={onAddMed}
          onSaveMed={onSaveMed}
          onRemoveMed={onRemoveMed}
          t={t}
          dir={dir}
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
            ["active", t('patients.activeTab')],
            ["archive", t('patients.archiveTab')],
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
            onClick={() => {
              setNewP({
                name: "",
                dob: "",
                idNum: "",
                admitDate: "",
                addiction: "",
                notes: "",
                roomId: rooms[0]?.id || "",
              });
              setShowAdd(true);
            }}
          >
            {t('patients.addPatientButton')}
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
              <Th>{t('patients.tableHeaderName')}</Th>
              <Th>{t('patients.tableHeaderAdmission')}</Th>
              <Th>{t('patients.tableHeaderDaysInCenter')}</Th>
              {filter === "active" ? (
                <>
                  <Th>{t('patients.tableHeaderStatus')}</Th>
                  {(user.role === "manager" || user.role === "org_manager") && (
                    <Th></Th>
                  )}
                </>
              ) : (
                <>
                  <Th>{t('patients.tableHeaderDischargeReason')}</Th>
                  <Th>{t('patients.tableHeaderDate')}</Th>
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
                          <Badge type="green">{t('patients.patientActiveStatus')}</Badge>
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
                            {t('patients.endButton')}
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
