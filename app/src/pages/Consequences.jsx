import { useState } from "react";
import { C, pName, uName } from "../data/constants";
import { V } from "../data/validationLimits";
import { sanitizeFreeText } from "../lib/inputSanitize";
import { Badge, Card, CT, Alrt, Btn, Modal, FL, FI, FS, FTA } from "../components/ui";
import useBreakpoint from "../hooks/useBreakpoint";

export default function Consequences({
  consequences,
  patients,
  users,
  user,
  toast,
  onAdd,
  onUpdate,
  t = (k) => k,
  dir = "ltr",
}) {
  const { isMobile } = useBreakpoint();
  const [showNew, setShowNew] = useState(false);
  const [newC, setNewC] = useState({
    patientId: "",
    type: "phone",
    desc: "",
    reason: "",
  });
  const typeLabels = {
    phone: t('consequences.phoneRestriction'),
    visit: t('consequences.homeVisitCancellation'),
    cigarettes: t('consequences.cigaretteRestriction'),
    other: t('consequences.other'),
  };
  const pending = consequences.filter((c) => c.status === "pending");
  const approved = consequences.filter((c) => c.status === "approved");
  const approve = async (id) => {
    try {
      await onUpdate(id, { status: "approved", approvedBy: user.name });
      toast(t('consequences.toastApproveSuccess'));
    } catch { toast(t('consequences.toastApproveFailed')); }
  };
  const reject = async (id) => {
    try {
      await onUpdate(id, { status: "rejected" });
      toast(t('consequences.toastRejectSuccess'));
    } catch { toast(t('consequences.toastRejectFailed')); }
  };
  const cancel = async (id) => {
    try {
      await onUpdate(id, { status: "rejected" });
      toast(t('consequences.toastCancelSuccess'));
    } catch { toast(t('consequences.toastCancelFailed')); }
  };
  const addConsequence = async () => {
    if (!newC.patientId || !newC.desc) {
      toast(t('consequences.toastSelectPatient'));
      return;
    }
    try {
      await onAdd({ patientId: newC.patientId, type: newC.type, description: newC.desc });
      setNewC({ patientId: "", type: "phone", desc: "", reason: "" });
      setShowNew(false);
      toast(t('consequences.toastAddSuccess'));
    } catch { toast(t('consequences.toastAddFailed')); }
  };
  return (
    <div>
      {" "}
      {showNew && (
        <Modal onClose={() => setShowNew(false)} title={t('consequences.proposeConsequenceTitle')}>
          {" "}
          <Alrt type="orange" icon="🔐">
            {t('consequences.approvalWarning')}
          </Alrt>{" "}
          <FL label={t('consequences.patientLabel')}>
            <FS
              value={newC.patientId}
              onChange={(v) => setNewC((c) => ({ ...c, patientId: v }))}
              options={patients
                .filter((p) => p.status === "active")
                .map((p) => ({ v: p.id, l: p.name }))}
              dir={dir}
            />
          </FL>{" "}
          <FL label={t('consequences.consequenceTypeLabel')}>
            <FS
              value={newC.type}
              onChange={(v) => setNewC((c) => ({ ...c, type: v }))}
              options={Object.entries(typeLabels).map(([k, v]) => ({
                v: k,
                l: v,
              }))}
            />
          </FL>{" "}
          <FL label={t('consequences.descriptionLabel')}>
            <FI
              value={newC.desc}
              onChange={(v) => setNewC((c) => ({ ...c, desc: v }))}
              placeholder={t('consequences.descriptionPlaceholder')}
              sanitize={(s) => sanitizeFreeText(s, V.SHORT_LABEL)}
              maxLength={V.SHORT_LABEL}
              dir={dir}
            />
          </FL>{" "}
          <FL label={t('consequences.reasonLabel')}>
            <FTA
              value={newC.reason}
              onChange={(v) => setNewC((c) => ({ ...c, reason: v }))}
              placeholder={t('consequences.reasonPlaceholder')}
              rows={2}
              sanitize={sanitizeFreeText}
              maxLength={V.NOTE_MAX}
              dir={dir}
            />
          </FL>{" "}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Btn color="orange" onClick={addConsequence}>
              {t('consequences.proposeButton')}
            </Btn>
            <Btn color="outline" onClick={() => setShowNew(false)}>
              {t('consequences.cancelButton')}
            </Btn>
          </div>{" "}
        </Modal>
      )}{" "}
      <Alrt type="red" icon="🔐">
        Consequence only valid after manager approval. {pending.length} pending.
      </Alrt>{" "}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        {" "}
        <Card>
          {" "}
          <CT
            icon="⏳"
            bg="#fce8e8"
            right={
              <Btn color="orange" size="sm" onClick={() => setShowNew(true)}>
                {t('consequences.proposeButtonShort')}
              </Btn>
            }
          >
            {t('consequences.pendingTitle')}
          </CT>{" "}
          {pending.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: 20,
                color: C.soft,
                fontSize: 13,
              }}
            >
              {t('consequences.noPendingItems')}
            </div>
          )}{" "}
          {pending.map((c) => (
            <div
              key={c.id}
              style={{
                borderRadius: 10,
                border: `1.5px solid ${C.red}`,
                background: "#fce8e8",
                padding: 14,
                marginBottom: 10,
              }}
            >
              {" "}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 5,
                }}
              >
                {" "}
                <div style={{ fontWeight: 800, fontSize: 13, color: C.red }}>
                  {typeLabels[c.type] || c.type}
                </div>{" "}
                <Badge type="orange" style={{ marginRight: "auto" }}>
                  {t('consequences.pendingBadge')}
                </Badge>{" "}
              </div>{" "}
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>
                {pName(patients, c.patientId)}
              </div>{" "}
              <div style={{ fontSize: 12, color: C.mid, marginBottom: 3 }}>
                {c.desc}
              </div>{" "}
              <div style={{ fontSize: 11, color: C.soft, marginBottom: 10 }}>
                {t('consequences.proposedByLabel')} {uName(users, c.proposedBy)} | {c.reason}
              </div>{" "}
              {user.role === "manager" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn color="teal" size="sm" onClick={() => approve(c.id)}>
                    {t('consequences.approveButton')}
                  </Btn>
                  <Btn color="outline" size="sm" onClick={() => reject(c.id)}>
                    {t('consequences.rejectButton')}
                  </Btn>
                </div>
              )}{" "}
            </div>
          ))}{" "}
        </Card>{" "}
        <Card>
          {" "}
          <CT icon="✅" bg="#e8f8ef">
            {t('consequences.activeConsequencesTitle')}
          </CT>{" "}
          {approved.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: 20,
                color: C.soft,
                fontSize: 13,
              }}
            >
              {t('consequences.noActiveResults')}
            </div>
          )}{" "}
          {approved.map((c) => (
            <div
              key={c.id}
              style={{
                borderRadius: 10,
                border: `1.5px solid ${C.border}`,
                padding: 14,
                marginBottom: 10,
              }}
            >
              {" "}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 5,
                }}
              >
                {" "}
                <div style={{ fontWeight: 800, fontSize: 13 }}>
                  {typeLabels[c.type]}
                </div>{" "}
                <Badge type="green" style={{ marginRight: "auto" }}>
                  {t('consequences.activeBadge')}
                </Badge>{" "}
              </div>{" "}
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>
                {pName(patients, c.patientId)}
              </div>{" "}
              <div style={{ fontSize: 12, color: C.mid, marginBottom: 3 }}>
                {c.desc}
              </div>{" "}
              <div style={{ fontSize: 11, color: C.soft, marginBottom: 8 }}>
                {t('consequences.approvedByLabel')} {uName(users, c.approvedBy)}
              </div>{" "}
              {user.role === "manager" && (
                <Btn color="outline" size="sm" onClick={() => cancel(c.id)}>
                  {t('consequences.cancelButton')}
                </Btn>
              )}{" "}
            </div>
          ))}{" "}
        </Card>{" "}
      </div>{" "}
    </div>
  );
}
