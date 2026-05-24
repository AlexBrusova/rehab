import { useState } from "react";
import { C, pName, BADGE_STYLES } from "../data/constants";
import { V } from "../data/validationLimits";
import { sanitizeFreeText, sanitizeTopic } from "../lib/inputSanitize";
import { Badge, Card, Alrt, Btn, Modal, FL, FI, FS, FTA, VoiceBtn } from "../components/ui";
import useBreakpoint from "../hooks/useBreakpoint";

export default function Therapy({
  patients,
  therapy,
  user,
  toast,
  onAddSession,
  t = (k) => k,
  dir = "ltr",
}) {
  const { isMobile } = useBreakpoint();
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState(null);
  const [newT, setNewT] = useState({
    patientId: "",
    topic: "",
    notes: "",
    counselorNote: "",
    urgency: "NORMAL",
  });
  const effectivePatientId = newT.patientId || patients[0]?.id || "";
  const addSession = async () => {
    if (!newT.topic) {
      toast(t('therapy.toastTopicRequired'));
      return;
    }
    try {
      await onAddSession({ ...newT, patientId: effectivePatientId });
      setNewT({ patientId: "", topic: "", notes: "", counselorNote: "", urgency: "NORMAL" });
      setShowNew(false);
      toast(t('therapy.toastSessionRecorded'));
    } catch { toast(t('therapy.toastSessionFailed')); }
  };
  const UP = {
    NORMAL: { l: t('therapy.normalUrgency'), t: "teal" },
    ATTENTION: { l: t('therapy.attentionUrgency'), t: "orange" },
    URGENT: { l: t('therapy.urgentUrgency'), t: "red" },
  };
  return (
    <div>
      {" "}
      {showNew && (
        <Modal
          onClose={() => setShowNew(false)}
          title={t('therapy.newSessionTitle')}
          width={500}
        >
          {" "}
          <FL label={t('therapy.patientLabel')}>
            <FS
              value={effectivePatientId}
              onChange={(v) => setNewT((t) => ({ ...t, patientId: v }))}
              options={patients.map((p) => ({ v: p.id, l: p.name }))}
            />
          </FL>{" "}
          <FL label={t('therapy.sessionTopicLabel')}>
            <FI
              value={newT.topic}
              onChange={(v) => setNewT((t) => ({ ...t, topic: v }))}
              placeholder={t('therapy.sessionTopicPlaceholder')}
              sanitize={sanitizeTopic}
              maxLength={V.TOPIC_MAX}
              dir={dir}
            />
          </FL>{" "}
          <FL label={t('therapy.urgencyLabel')}>
            {" "}
            <div style={{ display: "flex", gap: 8 }}>
              {" "}
              {Object.entries(UP).map(([k, v]) => (
                <div
                  key={k}
                  onClick={() => setNewT((t) => ({ ...t, urgency: k }))}
                  style={{
                    flex: 1,
                    padding: "9px",
                    borderRadius: 10,
                    border: `2px solid ${newT.urgency === k ? BADGE_STYLES[v.t].c : C.border}`,
                    background:
                      newT.urgency === k ? BADGE_STYLES[v.t].bg : "#fff",
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                >
                  {" "}
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: newT.urgency === k ? BADGE_STYLES[v.t].c : C.mid,
                    }}
                  >
                    {v.l}
                  </div>{" "}
                </div>
              ))}{" "}
            </div>{" "}
          </FL>{" "}
          <FL label={t('therapy.privateRecordLabel')}>
            {" "}
            <div style={{ marginBottom: 6 }}>
              <VoiceBtn
                onTranscript={(v) =>
                  setNewT((t) => ({ ...t, notes: t.notes + v }))
                }
              />
            </div>{" "}
            <FTA
              value={newT.notes}
              onChange={(v) => setNewT((t) => ({ ...t, notes: v }))}
              placeholder={t('therapy.privateRecordPlaceholder')}
              rows={3}
              sanitize={sanitizeFreeText}
              maxLength={V.NOTE_MAX}
              dir={dir}
            />{" "}
          </FL>{" "}
          <FL label={t('therapy.counselorNoteLabel')}>
            <FI
              value={newT.counselorNote}
              onChange={(v) => setNewT((t) => ({ ...t, counselorNote: v }))}
              placeholder={t('therapy.counselorNotePlaceholder')}
              sanitize={(s) => sanitizeFreeText(s, V.SHORT_LABEL)}
              maxLength={V.SHORT_LABEL}
              dir={dir}
            />
          </FL>{" "}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Btn color="purple" onClick={addSession}>
              {t('therapy.saveRecordButton')}
            </Btn>
            <Btn color="outline" onClick={() => setShowNew(false)}>
              {t('therapy.cancelButton')}
            </Btn>
          </div>{" "}
        </Modal>
      )}{" "}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
          gap: 12,
        }}
      >
        {" "}
        <Alrt type="purple" icon="🔐">
          {t('therapy.privateRecordWarning')}
        </Alrt>{" "}
        <Btn
          color="purple"
          style={{ flexShrink: 0 }}
          onClick={() => setShowNew(true)}
        >
          {t('therapy.newRecordButton')}
        </Btn>{" "}
      </div>{" "}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
        {" "}
        {therapy.map((session) => (
          <Card
            key={session.id}
            style={{
              cursor: "pointer",
              border: selected === session.id ? `2px solid ${C.purple}` : undefined,
            }}
            onClick={() => setSelected(selected === session.id ? null : session.id)}
          >
            {" "}
            <div style={{ display: "flex", gap: 10 }}>
              {" "}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg,${C.purple},#8e44ad)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                🧠
              </div>{" "}
              <div style={{ flex: 1 }}>
                {" "}
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 3 }}>
                  {pName(patients, session.patientId)}
                </div>{" "}
                <div style={{ fontSize: 12, color: C.soft, marginBottom: 6 }}>
                  {session.date} | {session.topic}
                </div>{" "}
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {" "}
                  <Badge type={UP[session.urgency].t}>{UP[session.urgency].l}</Badge>{" "}
                  {session.counselorNote && (
                    <Badge type="teal">{t('therapy.noteForCounselors')}</Badge>
                  )}{" "}
                </div>{" "}
              </div>{" "}
              <span style={{ color: C.soft, fontSize: 12 }}>
                {selected === session.id ? "▲" : "▼"}
              </span>{" "}
            </div>{" "}
            {selected === session.id && (
              <div
                style={{
                  marginTop: 12,
                  borderTop: `1px solid ${C.border}`,
                  paddingTop: 12,
                }}
              >
                {" "}
                {session.counselorNote && (
                  <div
                    style={{
                      background: "#e3f7f8",
                      border: "1px solid #7dd4d7",
                      borderRadius: 8,
                      padding: "9px 12px",
                      marginBottom: 8,
                      fontSize: 13,
                      color: "#054548",
                    }}
                  >
                    <strong>{t('therapy.noteForCounselorsContent')}</strong> {session.counselorNote}
                  </div>
                )}{" "}
                {user.role === "manager" || user.role === "therapist" ? (
                  <div
                    style={{
                      background: "#f0e8fb",
                      border: `1px solid #c9a8f0`,
                      borderRadius: 8,
                      padding: "9px 12px",
                      fontSize: 13,
                      color: "#3d1a6b",
                    }}
                  >
                    <strong>{t('therapy.privateRecordContent')}</strong> {session.notes}
                  </div>
                ) : (
                  <div
                    style={{
                      background: "#f0e8fb",
                      border: `1px solid #c9a8f0`,
                      borderRadius: 8,
                      padding: "9px 12px",
                      fontSize: 13,
                      color: "#3d1a6b",
                      fontStyle: "italic",
                    }}
                  >
                    {t('therapy.sessionHiddenFromCounselors')}
                  </div>
                )}{" "}
              </div>
            )}{" "}
          </Card>
        ))}{" "}
      </div>{" "}
    </div>
  );
}
