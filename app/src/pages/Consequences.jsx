import { useState } from "react";
import { C, pName, uName } from "../data/constants";
import { Badge, Card, CT, Alrt, Btn, Modal, FL, FI, FS, FTA } from "../components/ui";

export default function Consequences({
  consequences,
  setConsequences,
  patients,
  users,
  user,
  toast,
  onAdd,
  onUpdate,
}) {
  const [showNew, setShowNew] = useState(false);
  const [newC, setNewC] = useState({
    patientId: "",
    type: "phone",
    desc: "",
    reason: "",
  });
  const typeLabels = {
    phone: "📵 Phone Restriction",
    visit: "🏠 Home Visit Cancellation",
    cigarettes: "🚬 Cigarette Restriction",
    other: "📝 Other",
  };
  const pending = consequences.filter((c) => c.status === "pending");
  const approved = consequences.filter((c) => c.status === "approved");
  const approve = async (id) => {
    try {
      await onUpdate(id, { status: "approved", approvedBy: user.name });
      toast("✅ Consequence approved");
    } catch { toast("❌ Failed"); }
  };
  const reject = async (id) => {
    try {
      await onUpdate(id, { status: "rejected" });
      toast("Consequence rejected");
    } catch { toast("❌ Failed"); }
  };
  const cancel = async (id) => {
    try {
      await onUpdate(id, { status: "rejected" });
      toast("Consequence cancelled");
    } catch { toast("❌ Failed"); }
  };
  const addConsequence = async () => {
    if (!newC.patientId || !newC.desc) {
      toast("⚠️ Please select a patient and fill Description");
      return;
    }
    try {
      await onAdd({ patientId: newC.patientId, type: newC.type, description: newC.desc });
      setNewC({ patientId: "", type: "phone", desc: "", reason: "" });
      setShowNew(false);
      toast("✅ Consequence proposed – awaiting manager approval");
    } catch { toast("❌ Failed to add consequence"); }
  };
  return (
    <div>
      {" "}
      {showNew && (
        <Modal onClose={() => setShowNew(false)} title="⚠️ Propose Consequence">
          {" "}
          <Alrt type="orange" icon="🔐">
            Consequence only valid after manager approval
          </Alrt>{" "}
          <FL label="Patient">
            <FS
              value={newC.patientId}
              onChange={(v) => setNewC((c) => ({ ...c, patientId: v }))}
              options={patients
                .filter((p) => p.status === "active")
                .map((p) => ({ v: p.id, l: p.name }))}
            />
          </FL>{" "}
          <FL label="Consequence Type">
            <FS
              value={newC.type}
              onChange={(v) => setNewC((c) => ({ ...c, type: v }))}
              options={Object.entries(typeLabels).map(([k, v]) => ({
                v: k,
                l: v,
              }))}
            />
          </FL>{" "}
          <FL label="Description (duration, details)">
            <FI
              value={newC.desc}
              onChange={(v) => setNewC((c) => ({ ...c, desc: v }))}
              placeholder="e.g.: Phone Restriction 3 days"
            />
          </FL>{" "}
          <FL label="Reason">
            <FTA
              value={newC.reason}
              onChange={(v) => setNewC((c) => ({ ...c, reason: v }))}
              placeholder="Description of what happened..."
              rows={2}
            />
          </FL>{" "}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Btn color="orange" onClick={addConsequence}>
              ✓ Propose
            </Btn>
            <Btn color="outline" onClick={() => setShowNew(false)}>
              Cancel
            </Btn>
          </div>{" "}
        </Modal>
      )}{" "}
      <Alrt type="red" icon="🔐">
        Consequence only valid after manager approval. {pending.length} pending.
      </Alrt>{" "}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {" "}
        <Card>
          {" "}
          <CT
            icon="⏳"
            bg="#fce8e8"
            right={
              <Btn color="orange" size="sm" onClick={() => setShowNew(true)}>
                + Propose
              </Btn>
            }
          >
            pending approval
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
              ✅ No pending items
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
                  Pending
                </Badge>{" "}
              </div>{" "}
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>
                {pName(patients, c.patientId)}
              </div>{" "}
              <div style={{ fontSize: 12, color: C.mid, marginBottom: 3 }}>
                {c.desc}
              </div>{" "}
              <div style={{ fontSize: 11, color: C.soft, marginBottom: 10 }}>
                Proposed by: {uName(users, c.proposedBy)} | {c.reason}
              </div>{" "}
              {user.role === "manager" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn color="teal" size="sm" onClick={() => approve(c.id)}>
                    ✓ Approve
                  </Btn>
                  <Btn color="outline" size="sm" onClick={() => reject(c.id)}>
                    ✗ Reject
                  </Btn>
                </div>
              )}{" "}
            </div>
          ))}{" "}
        </Card>{" "}
        <Card>
          {" "}
          <CT icon="✅" bg="#e8f8ef">
            Active Consequences
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
              No results active
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
                  Active
                </Badge>{" "}
              </div>{" "}
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>
                {pName(patients, c.patientId)}
              </div>{" "}
              <div style={{ fontSize: 12, color: C.mid, marginBottom: 3 }}>
                {c.desc}
              </div>{" "}
              <div style={{ fontSize: 11, color: C.soft, marginBottom: 8 }}>
                Approved by: {uName(users, c.approvedBy)}
              </div>{" "}
              {user.role === "manager" && (
                <Btn color="outline" size="sm" onClick={() => cancel(c.id)}>
                  Cancel
                </Btn>
              )}{" "}
            </div>
          ))}{" "}
        </Card>{" "}
      </div>{" "}
    </div>
  );
}
