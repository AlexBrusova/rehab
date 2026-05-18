import { useState } from "react";
import { C, uName } from "../data/constants";
import { V } from "../data/validationLimits";
import { sanitizeFreeText } from "../lib/inputSanitize";
import { Badge, Card, CT, Btn, Th, Td, Modal, FL, FS, FTA, VoiceBtn } from "../components/ui";

export default function Shifts({
  shifts,
  setShifts,
  users,
  user,
  toast,
  onCreateShift,
  onUpdateShift,
  t = (k) => k,
  dir = "ltr",
}) {
  const [shiftActive, setShiftActive] = useState(true);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [receivedFrom, setReceivedFrom] = useState("Miriam Saad");
  const [handedTo, setHandedTo] = useState("");
  const [notes, setNotes] = useState(
    "Yael Shemesh having a hard time – pay attention.\nEvening distribution on time 20:00.",
  );
  const counselors = users
    .filter((u) => u.role === "counselor" && u.id !== user.id)
    .map((u) => u.name);
  const log = [
    { t: "09:05", i: "✅", tx: "Shift start" },
    { t: "09:30", i: "🗣️", tx: "Morning group – 22 Present" },
    { t: "09:15", i: "💊", tx: "Medication Distribution Morning – 23/24" },
    { t: "11:00", i: "🗣️", tx: "Group Therapy – 20 Present" },
    { t: "12:10", i: "📱", tx: "Ron Katz – Phone 30 min" },
    { t: "13:00", i: "💊", tx: "Medication Distribution Noon" },
    { t: "14:30", i: "🚨", tx: "Yael Shemesh – SOS: Sedation" },
    { t: "14:00", i: "🗣️", tx: "Skills workshop – Active" },
  ];
  return (
    <div>
      {" "}
      {showStart && (
        <Modal onClose={() => setShowStart(false)} title={t('shifts.startShiftTitle')}>
          {" "}
          <FL label={t('shifts.receivingFromLabel')}>
            <FS
              value={receivedFrom}
              onChange={setReceivedFrom}
              options={counselors}
              dir={dir}
            />
          </FL>{" "}
          <div
            style={{
              background: "#e3f7f8",
              border: "1px solid #7dd4d7",
              borderRadius: 10,
              padding: 14,
              marginBottom: 16,
            }}
          >
            {" "}
            <div
              style={{
                fontWeight: 700,
                fontSize: 13,
                color: C.teal,
                marginBottom: 8,
              }}
            >
              {t('shifts.handoffNotesTitle')}
            </div>{" "}
            <div style={{ fontSize: 13, color: C.mid, whiteSpace: "pre-line" }}>
              {notes}
            </div>{" "}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 10,
                fontSize: 12,
                fontWeight: 700,
                color: C.teal,
                cursor: "pointer",
              }}
            >
              <input type="checkbox" /> {t('shifts.confirmReadCheckbox')}
            </label>{" "}
          </div>{" "}
          <div style={{ display: "flex", gap: 10 }}>
            <Btn
              color="teal"
              onClick={async () => {
                try {
                  const today = new Date().toLocaleDateString("en-GB");
                  const start = new Date().toTimeString().slice(0, 5);
                  await onCreateShift({ date: today, receivedFrom, start });
                  setShowStart(false);
                  setShiftActive(true);
                  toast(t('shifts.toastStartSuccess'));
                } catch {
                  toast(t('shifts.toastStartFailed'));
                }
              }}
            >
              {t('shifts.startShiftButton')}
            </Btn>
            <Btn color="outline" onClick={() => setShowStart(false)}>
              {t('shifts.cancelButton')}
            </Btn>
          </div>{" "}
        </Modal>
      )}{" "}
      {showEnd && (
        <Modal
          onClose={() => setShowEnd(false)}
          title={t('shifts.endShiftTitle')}
          width={460}
        >
          {" "}
          <div
            style={{
              background: "#f7f9fc",
              borderRadius: 10,
              padding: 14,
              marginBottom: 14,
              fontSize: 12,
            }}
          >
            {" "}
            <div style={{ fontWeight: 800, marginBottom: 8 }}>
              {t('shifts.autoSummaryTitle')}
            </div>{" "}
            {[
              ["Groups", "3 Groups"],
              ["Distributions", "1-2 missing"],
              ["Events", "SOS ×1"],
              ["Phones", "2 uses"],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "4px 0",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <span style={{ color: C.mid }}>{k}</span>
                <span style={{ fontWeight: 700 }}>{v}</span>
              </div>
            ))}{" "}
          </div>{" "}
          <FL label={t('shifts.handoffNotesLabel')}>
            {" "}
            <div style={{ marginBottom: 6 }}>
              <VoiceBtn onTranscript={(v) => setNotes(v)} />
            </div>{" "}
            <FTA
              value={notes}
              onChange={setNotes}
              placeholder={t('shifts.handoffNotesPlaceholder')}
              rows={3}
              sanitize={sanitizeFreeText}
              maxLength={V.NOTE_MAX}
              dir={dir}
            />{" "}
          </FL>{" "}
          <FL label={t('shifts.handingToLabel')}>
            {" "}
            <FS
              value={handedTo}
              onChange={setHandedTo}
              options={[
                { v: "", l: t('shifts.selectCounselorPlaceholder') },
                ...counselors.map((n) => ({ v: n, l: n })),
              ]}
              dir={dir}
            />{" "}
          </FL>{" "}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Btn
              color="teal"
              disabled={!handedTo}
              onClick={async () => {
                if (!handedTo) {
                  toast(t('shifts.toastSelectCounselor'));
                  return;
                }
                try {
                  const activeShift = shifts.find(
                    (s) => s.counselorId === user.id && s.status === "ACTIVE"
                  );
                  const end = new Date().toTimeString().slice(0, 5);
                  if (activeShift) {
                    await onUpdateShift(activeShift.id, {
                      status: "completed", handedTo, note: notes, end,
                    });
                  } else {
                    const today = new Date().toLocaleDateString("en-GB");
                    await onCreateShift({
                      date: today, receivedFrom, handedTo,
                      note: notes, end, status: "completed",
                    });
                  }
                  setShowEnd(false);
                  setShiftActive(false);
                  toast(`✅ Handed to ${handedTo} – Pending approval`);
                } catch {
                  toast(t('shifts.toastEndFailed'));
                }
              }}
            >
              {t('shifts.finishHandoffButton')}
            </Btn>
            <Btn color="outline" onClick={() => setShowEnd(false)}>
              {t('shifts.cancelButton')}
            </Btn>
          </div>{" "}
        </Modal>
      )}{" "}
      {shiftActive ? (
        <>
          {" "}
          <div
            style={{
              background: `linear-gradient(135deg,${C.navy},${C.navyMid})`,
              borderRadius: 16,
              padding: 24,
              color: "#fff",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}
          >
            {" "}
            <div>
              <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>
                {t('shifts.activeShiftLabel')}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 3 }}>
                {user.name}
              </div>
              <div style={{ fontSize: 13, opacity: 0.65 }}>
                09:00 – Received from: {receivedFrom}
              </div>
            </div>{" "}
            <div
              style={{
                marginRight: "auto",
                textAlign: "center",
                background: "rgba(255,255,255,0.1)",
                borderRadius: 12,
                padding: "10px 18px",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 900, color: "#5dffd5" }}>
                7:42
              </div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>{t('shifts.hoursActiveLabel')}</div>
            </div>{" "}
            <Btn color="orange" onClick={() => setShowEnd(true)}>
              {t('shifts.endShiftButton')}
            </Btn>{" "}
          </div>{" "}
          <Card style={{ marginBottom: 16 }}>
            {" "}
            <CT icon="📋" bg="#e3f7f8">
              {t('shifts.shiftJournalTitle')}
            </CT>{" "}
            {log.map((e, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "8px 0",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                {" "}
                <span
                  style={{
                    fontSize: 11,
                    color: C.soft,
                    minWidth: 42,
                    paddingTop: 2,
                  }}
                >
                  {e.t}
                </span>{" "}
                <span style={{ fontSize: 16 }}>{e.i}</span>{" "}
                <span style={{ fontSize: 13 }}>{e.tx}</span>{" "}
              </div>
            ))}{" "}
          </Card>{" "}
        </>
      ) : (
        <div style={{ textAlign: "center", padding: 40 }}>
          {" "}
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔄</div>{" "}
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>
            {t('shifts.noActiveShift')}
          </div>{" "}
          <Btn color="teal" onClick={() => setShowStart(true)}>
            {t('shifts.beginShiftButton')}
          </Btn>{" "}
        </div>
      )}{" "}
      <Card>
        {" "}
        <CT icon="📁" bg="#f0f2f5">
          {t('shifts.shiftHistoryTitle')}
        </CT>{" "}
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
        >
          <thead>
            <tr>
              <Th>{t('shifts.counselorColumn')}</Th>
              <Th>{t('shifts.startColumn')}</Th>
              <Th>{t('shifts.endColumn')}</Th>
              <Th>{t('shifts.receivedFromColumn')}</Th>
              <Th>{t('shifts.handedToColumn')}</Th>
              <Th>{t('shifts.statusColumn')}</Th>
            </tr>
          </thead>
          <tbody>
            {" "}
            {shifts.map((s) => (
              <tr key={s.id}>
                {" "}
                <Td style={{ fontWeight: 700 }}>
                  {uName(users, s.counselorId)}
                </Td>{" "}
                <Td style={{ fontSize: 12, color: C.soft }}>{s.start}</Td>{" "}
                <Td style={{ fontSize: 12, color: C.soft }}>{s.end}</Td>{" "}
                <Td style={{ fontSize: 12 }}>{s.receivedFrom}</Td>{" "}
                <Td style={{ fontSize: 12 }}>{s.handedTo}</Td>{" "}
                <Td>
                  <Badge type={s.accepted ? "green" : "orange"}>
                    {s.accepted ? t('shifts.approvedBadge') : t('shifts.pendingBadge')}
                  </Badge>
                </Td>{" "}
              </tr>
            ))}{" "}
          </tbody>
        </table>
      </Card>{" "}
    </div>
  );
}
