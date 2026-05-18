import { useState } from "react";
import { C } from "../data/constants";
import { V } from "../data/validationLimits";
import {
  sanitizeMedDose,
  sanitizeMedName,
  sanitizePersonName,
} from "../lib/inputSanitize";
import { Badge, Card, CT, Alrt, Btn, Th, Td, Modal, FL, FI, FS } from "../components/ui";
import useBreakpoint from "../hooks/useBreakpoint";

export default function Medications({ t = (k) => k, dir = "ltr", patients, meds, dist, user, toast, onSetStatus }) {
  const today = new Date().toLocaleDateString("en-GB");
  const { isMobile } = useBreakpoint();
  const [shift, setShift] = useState("morning");
  const [showSOS, setShowSOS] = useState(false);
  const [sosData, setSosData] = useState({
    patientId: patients[0]?.id || "",
    medName: "",
    dose: "",
    reason: "Headache",
    approvedBy: "",
  }); /* extra meds: { patientId -> [{name,time}] } */
  const [extraMeds, setExtraMeds] = useState(
    {},
  ); /* quick-add modal for extra med */
  const [showExtra, setShowExtra] = useState(null); /* patientId */
  const [extraName, setExtraName] =
    useState(
      "",
    ); /* alerts shown to manager: list of {patientName, medName, by, time} */
  const [extraAlerts, setExtraAlerts] = useState([
    {
      id: "ea1",
      patientName: "Yossi Levi",
      medName: "Diphenhydramine",
      by: "Amir Menachem",
      time: "11:42",
    },
  ]);
  const shiftLabel = {
    morning: t('medications.shiftMorning'),
    noon: t('medications.shiftNoon'),
    evening: t('medications.shiftEvening'),
    night: t('medications.shiftNight'),
  };
  const shiftKey = {
    morning: "morning",
    noon: "noon",
    evening: "evening",
    night: "night",
  };
  const activePats = patients.filter((p) => p.status === "active");
  const shiftPats = activePats.filter((p) =>
    meds.some((m) => m.patientId === p.id && m[shiftKey[shift]]),
  );
  const changedMeds = meds.filter((m) => m.changed);
  const getStatus = (pid) =>
    dist.find((d) => d.patientId === pid && d.shift === shift && d.date === today)?.status || null;
  const setStatus = (pid, status) => {
    onSetStatus(pid, shift, today, status);
  };
  const addExtraMed = () => {
    if (!extraName.trim()) {
      toast(t('medications.toastMedicationNameRequired'));
      return;
    }
    const timeNow = new Date().toTimeString().slice(0, 5);
    const pat = patients.find((p) => p.id === showExtra);
    setExtraMeds((prev) => ({
      ...prev,
      [showExtra]: [
        ...(prev[showExtra] || []),
        { name: extraName, time: timeNow, id: "ex" + Date.now() },
      ],
    }));
    setExtraAlerts((prev) => [
      {
        id: "ea" + Date.now(),
        patientName: pat?.name,
        medName: extraName,
        by: user.name,
        time: timeNow,
      },
      ...prev,
    ]);
    setExtraName("");
    setShowExtra(null);
    toast(`🔔 ${pat?.name} received ${extraName} – managers notified`);
  };
  const removeExtra = (pid, eid) => {
    setExtraMeds((prev) => ({
      ...prev,
      [pid]: (prev[pid] || []).filter((e) => e.id !== eid),
    }));
  };
  const submitSOS = () => {
    if (!sosData.medName || !sosData.approvedBy) {
      toast(t('medications.toastApprovedByRequired'));
      return;
    }
    toast(
      `✅ SOS recorded for ${patients.find((p) => p.id === sosData.patientId)?.name} | Approved by: ${sosData.approvedBy}`,
    );
    setShowSOS(false);
    setSosData({
      patientId: patients[0]?.id || "",
      medName: "",
      dose: "",
      reason: "Headache",
      approvedBy: "",
    });
  };
  const CheckBtn = ({ pid, type, icon, color, bg }) => {
    const cur = getStatus(pid);
    return (
      <button
        onClick={() => setStatus(pid, cur === type ? null : type)}
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          border: `1.5px solid ${cur === type ? color : C.border}`,
          background: cur === type ? bg : "#fff",
          cursor: "pointer",
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {cur === type ? icon : "○"}
      </button>
    );
  };
  const isManager = user.role === "manager";
  return (
    <div>
      {" "}
      {/* SOS MODAL */}{" "}
      {showSOS && (
        <Modal onClose={() => setShowSOS(false)} title={t('medications.sosTitle')}>
          {" "}
          <Alrt type="purple" icon="🔐">
            {t('medications.mustMarkApprovalWarning')}
          </Alrt>{" "}
          <FL label={t('medications.patientLabel')}>
            <FS
              value={sosData.patientId}
              onChange={(v) => setSosData((s) => ({ ...s, patientId: v }))}
              options={patients
                .filter((p) => p.status === "active")
                .map((p) => ({ v: p.id, l: p.name }))}
              dir={dir}
            />
          </FL>{" "}
          <FL label={t('medications.medicationNameLabel')}>
            <FI
              value={sosData.medName}
              onChange={(v) => setSosData((s) => ({ ...s, medName: v }))}
              placeholder={t('medications.medicationNamePlaceholder')}
              sanitize={sanitizeMedName}
              maxLength={V.MED_NAME_MAX}
              dir={dir}
            />
          </FL>{" "}
          <FL label={t('medications.doseLabel')}>
            <FI
              value={sosData.dose}
              onChange={(v) => setSosData((s) => ({ ...s, dose: v }))}
              placeholder={t('medications.dosePlaceholder')}
              sanitize={sanitizeMedDose}
              maxLength={V.MED_DOSE_MAX}
              dir={dir}
            />
          </FL>{" "}
          <FL label={t('medications.reasonLabel')}>
            <FS
              value={sosData.reason}
              onChange={(v) => setSosData((s) => ({ ...s, reason: v }))}
              options={[
                { v: "Headache", l: t('medications.reasonHeadache') },
                { v: "Sedation", l: t('medications.reasonSedation') },
                { v: "Sleep", l: t('medications.reasonSleep') },
                { v: "SOS", l: t('medications.reasonSOS') },
                { v: "Other", l: t('medications.reasonOther') },
              ]}
              dir={dir}
            />
          </FL>{" "}
          <FL label={t('medications.approvedByLabel')}>
            <FI
              value={sosData.approvedBy}
              onChange={(v) => setSosData((s) => ({ ...s, approvedBy: v }))}
              placeholder={t('medications.approvedByPlaceholder')}
              sanitize={sanitizePersonName}
              maxLength={V.MED_PRESCRIBED_BY_MAX}
              dir={dir}
            />
          </FL>{" "}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Btn color="red" onClick={submitSOS}>
              {t('medications.saveSosButton')}
            </Btn>
            <Btn color="outline" onClick={() => setShowSOS(false)}>
              {t('medications.cancelButton')}
            </Btn>
          </div>{" "}
        </Modal>
      )}{" "}
      {/* EXTRA MED QUICK MODAL */}{" "}
      {showExtra && (
        <Modal
          onClose={() => {
            setShowExtra(null);
            setExtraName("");
          }}
          title={`${t('medications.extraMedicationTitle')} ${patients.find((p) => p.id === showExtra)?.name}`}
          width={360}
        >
          {" "}
          <Alrt type="orange" icon="🔔">
            {t('medications.extraMedicationWarning')}
          </Alrt>{" "}
          <FL label={t('medications.medicationGivenLabel')}>
            {" "}
            <FI
              value={extraName}
              onChange={setExtraName}
              placeholder={t('medications.medicationGivenPlaceholder')}
              sanitize={sanitizeMedName}
              maxLength={V.MED_NAME_MAX}
              dir={dir}
            />{" "}
          </FL>{" "}
          <div style={{ fontSize: 12, color: C.soft, marginBottom: 16 }}>
            {t('medications.doseNotRequired')}
          </div>{" "}
          <div style={{ display: "flex", gap: 10 }}>
            <Btn color="orange" onClick={addExtraMed}>
              {t('medications.recordAndSendAlert')}
            </Btn>
            <Btn
              color="outline"
              onClick={() => {
                setShowExtra(null);
                setExtraName("");
              }}
            >
              {t('medications.cancelButton')}
            </Btn>
          </div>{" "}
        </Modal>
      )}{" "}
      {/* MANAGER ALERTS */}{" "}
      {isManager && extraAlerts.length > 0 && (
        <Card style={{ marginBottom: 16, border: `2px solid ${C.orange}` }}>
          {" "}
          <CT icon="🔔" bg="#fef3e8">
            {t('medications.alertsTitle')}
          </CT>{" "}
          {extraAlerts.map((a) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              {" "}
              <span style={{ fontSize: 18 }}>💊</span>{" "}
              <div style={{ flex: 1 }}>
                {" "}
                <span style={{ fontWeight: 700 }}>{a.patientName}</span>{" "}
                <span style={{ color: C.mid }}>{t('medications.receivedColumn')}</span>{" "}
                <span style={{ fontWeight: 700, color: C.orange }}>
                  {a.medName}
                </span>{" "}
              </div>{" "}
              <span style={{ fontSize: 12, color: C.soft }}>
                {a.by} | {a.time}
              </span>{" "}
              <button
                onClick={() =>
                  setExtraAlerts((prev) => prev.filter((x) => x.id !== a.id))
                }
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: C.soft,
                  fontSize: 14,
                }}
              >
                ✕
              </button>{" "}
            </div>
          ))}{" "}
        </Card>
      )}{" "}
      {changedMeds.length > 0 && (
        <Alrt type="orange" icon="⚠️">
          <strong>{changedMeds.length} {t('medications.changedMedicationsWarning')}</strong> –{" "}
          {[
            ...new Set(
              changedMeds.map(
                (m) => patients.find((p) => p.id === m.patientId)?.name,
              ),
            ),
          ].join(", ")}
        </Alrt>
      )}{" "}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {" "}
        <Card>
          {" "}
          <CT icon="💊" bg="#e8f0fb">
            {t('medications.selectDistributionTime')}
          </CT>{" "}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {" "}
            {["morning", "noon", "evening", "night"].map((s) => (
              <Btn
                key={s}
                color={shift === s ? "teal" : "outline"}
                size="sm"
                onClick={() => setShift(s)}
              >
                {shiftLabel[s]}
              </Btn>
            ))}{" "}
          </div>{" "}
        </Card>{" "}
        <Card style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {" "}
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 3 }}>
              {t('medications.sosWarning')}
            </div>
            <div style={{ fontSize: 12, color: C.soft }}>
              {t('medications.sosDescription')}
            </div>
          </div>{" "}
          <Btn
            color="red"
            size="sm"
            style={{ marginRight: "auto" }}
            onClick={() => setShowSOS(true)}
          >
            {t('medications.sosButton')}
          </Btn>{" "}
        </Card>{" "}
      </div>{" "}
      <Card>
        {" "}
        <CT
          icon="📋"
          bg="#e3f7f8"
          right={
            <Btn
              color="teal"
              size="sm"
              onClick={() => toast(t('medications.toastSaveSuccess'))}
            >
              {t('medications.finishDistribution')}
            </Btn>
          }
        >
          {" "}
          {t('medications.distributionTitle')} {shiftLabel[shift]}{" "}
          <Badge type="blue" style={{ marginRight: 8 }}>
            {shiftPats.length} {t('medications.patientCountLabel')}
          </Badge>{" "}
        </CT>{" "}
        <div style={{ overflowX: "auto" }}>
          {" "}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
              minWidth: 500,
            }}
          >
            <thead>
              <tr>
                {" "}
                <Th>{t('medications.patientColumn')}</Th> <Th>{t('medications.regularMedicationsColumn')}</Th> <Th>{t('medications.receivedColumn')}</Th>{" "}
                <Th>{t('medications.partialColumn')}</Th> <Th>{t('medications.didNotTakeColumn')}</Th>{" "}
                <Th>{t('medications.extraMedicationsColumn')}</Th>{" "}
              </tr>
            </thead>
            <tbody>
              {" "}
              {shiftPats.map((p) => {
                const pm = meds.filter(
                  (m) => m.patientId === p.id && m[shiftKey[shift]],
                );
                const hasChange = pm.some((m) => m.changed);
                const extras = extraMeds[p.id] || [];
                return (
                  <tr
                    key={p.id}
                    style={{
                      background: hasChange
                        ? "#fff8f2"
                        : extras.length > 0
                          ? "#fffbf0"
                          : "transparent",
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    {" "}
                    <Td
                      style={{
                        fontWeight: 700,
                        color: hasChange ? C.orange : C.text,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {" "}
                      {p.name}{" "}
                      {hasChange && (
                        <span
                          style={{
                            background: C.orange,
                            color: "#fff",
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "2px 5px",
                            borderRadius: 6,
                            marginRight: 4,
                          }}
                        >
                          {t('medications.changedBadge')}
                        </span>
                      )}{" "}
                    </Td>{" "}
                    <Td style={{ fontSize: 12, color: C.soft }}>
                      {" "}
                      {pm
                        .map((m) => `${m.name} ${m.dose}${m.unit}`)
                        .join(", ")}{" "}
                    </Td>{" "}
                    <Td>
                      <CheckBtn
                        pid={p.id}
                        type="all"
                        icon="✅"
                        color={C.greenLt}
                        bg="#e8f8ef"
                      />
                    </Td>{" "}
                    <Td>
                      <CheckBtn
                        pid={p.id}
                        type="partial"
                        icon="⚠️"
                        color={C.orange}
                        bg="#fff5e8"
                      />
                    </Td>{" "}
                    <Td>
                      <CheckBtn
                        pid={p.id}
                        type="none"
                        icon="✗"
                        color={C.red}
                        bg="#fce8e8"
                      />
                    </Td>{" "}
                    <Td>
                      {" "}
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 4,
                          alignItems: "center",
                        }}
                      >
                        {" "}
                        {extras.map((e) => (
                          <span
                            key={e.id}
                            style={{
                              background: "#fff3cd",
                              border: "1px solid #ffc107",
                              borderRadius: 12,
                              padding: "2px 8px",
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#856404",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {" "}
                            💊 {e.name}{" "}
                            <span style={{ color: "#aaa", fontSize: 10 }}>
                              {e.time}
                            </span>{" "}
                            <button
                              onClick={() => removeExtra(p.id, e.id)}
                              style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                color: "#aaa",
                                fontSize: 12,
                                lineHeight: 1,
                                padding: 0,
                              }}
                            >
                              ✕
                            </button>{" "}
                          </span>
                        ))}{" "}
                        <button
                          onClick={() => {
                            setShowExtra(p.id);
                            setExtraName("");
                          }}
                          style={{
                            background: "transparent",
                            border: `1.5px dashed ${C.border}`,
                            borderRadius: 20,
                            padding: "2px 9px",
                            fontSize: 11,
                            cursor: "pointer",
                            color: C.soft,
                            fontFamily: "inherit",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {t('medications.extraAddButton')}
                        </button>{" "}
                      </div>{" "}
                    </Td>{" "}
                  </tr>
                );
              })}{" "}
            </tbody>
          </table>
        </div>{" "}
      </Card>{" "}
    </div>
  );
}
