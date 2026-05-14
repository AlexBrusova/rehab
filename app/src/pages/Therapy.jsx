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
      toast("⚠️ Please fill Topic");
      return;
    }
    try {
      await onAddSession({ ...newT, patientId: effectivePatientId });
      setNewT({ patientId: "", topic: "", notes: "", counselorNote: "", urgency: "NORMAL" });
      setShowNew(false);
      toast("✅ Session recorded");
    } catch { toast("❌ Failed to save session"); }
  };
  const UP = {
    NORMAL: { l: "Normal", t: "teal" },
    ATTENTION: { l: "Requires attention", t: "orange" },
    URGENT: { l: "Urgent", t: "red" },
  };
  return (
    <div>
      {" "}
      {showNew && (
        <Modal
          onClose={() => setShowNew(false)}
          title="🧠 New Session Record"
          width={500}
        >
          {" "}
          <FL label="Patient">
            <FS
              value={effectivePatientId}
              onChange={(v) => setNewT((t) => ({ ...t, patientId: v }))}
              options={patients.map((p) => ({ v: p.id, l: p.name }))}
            />
          </FL>{" "}
          <FL label="Session Topic">
            <FI
              value={newT.topic}
              onChange={(v) => setNewT((t) => ({ ...t, topic: v }))}
              placeholder="e.g.: Trauma processing"
              sanitize={sanitizeTopic}
              maxLength={V.TOPIC_MAX}
            />
          </FL>{" "}
          <FL label="Urgency">
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
          <FL label="Private record (therapist + manager only)">
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
              placeholder="Session content, observations, recommendations..."
              rows={3}
              sanitize={sanitizeFreeText}
              maxLength={V.NOTE_MAX}
            />{" "}
          </FL>{" "}
          <FL label="Note for Counselors (visible to all staff)">
            <FI
              value={newT.counselorNote}
              onChange={(v) => setNewT((t) => ({ ...t, counselorNote: v }))}
              placeholder='e.g.: "Patient needs extra support"'
              sanitize={(s) => sanitizeFreeText(s, V.SHORT_LABEL)}
              maxLength={V.SHORT_LABEL}
            />
          </FL>{" "}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Btn color="purple" onClick={addSession}>
              ✓ Save Record
            </Btn>
            <Btn color="outline" onClick={() => setShowNew(false)}>
              Cancel
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
          <strong>Private record</strong> – therapist + manager only.{" "}
          <strong>Counselor Notes</strong> – visible to all staff.
        </Alrt>{" "}
        <Btn
          color="purple"
          style={{ flexShrink: 0 }}
          onClick={() => setShowNew(true)}
        >
          + New Record
        </Btn>{" "}
      </div>{" "}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
        {" "}
        {therapy.map((t) => (
          <Card
            key={t.id}
            style={{
              cursor: "pointer",
              border: selected === t.id ? `2px solid ${C.purple}` : undefined,
            }}
            onClick={() => setSelected(selected === t.id ? null : t.id)}
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
                  {pName(patients, t.patientId)}
                </div>{" "}
                <div style={{ fontSize: 12, color: C.soft, marginBottom: 6 }}>
                  {t.date} | {t.topic}
                </div>{" "}
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {" "}
                  <Badge type={UP[t.urgency].t}>{UP[t.urgency].l}</Badge>{" "}
                  {t.counselorNote && (
                    <Badge type="teal">💬 Note for Counselors</Badge>
                  )}{" "}
                </div>{" "}
              </div>{" "}
              <span style={{ color: C.soft, fontSize: 12 }}>
                {selected === t.id ? "▲" : "▼"}
              </span>{" "}
            </div>{" "}
            {selected === t.id && (
              <div
                style={{
                  marginTop: 12,
                  borderTop: `1px solid ${C.border}`,
                  paddingTop: 12,
                }}
              >
                {" "}
                {t.counselorNote && (
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
                    <strong>Note for Counselors:</strong> {t.counselorNote}
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
                    <strong>Private record:</strong> {t.notes}
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
                    Session content hidden from Counselors 🔒
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
