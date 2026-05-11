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
}) {
  const [showNew, setShowNew] = useState(false);
  const [newC, setNewC] = useState({
    patientId: "p1",
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
  const approve = (id) => {
    setConsequences((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: "approved", approvedBy: user.id } : c,
      ),
    );
    toast("✅ Consequence approved");
  };
  const reject = (id) => {
    setConsequences((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "rejected" } : c)),
    );
    toast("Consequence rejected");
  };
  const cancel = (id) => {
    setConsequences((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "cancelled" } : c)),
    );
    toast("Consequence cancelled");
  };
  const addConsequence = () => {
    if (!newC.desc || !newC.reason) {
      toast("⚠️ Please fill Description and Reason");
      return;
    }
    setConsequences((prev) => [
      ...prev,
      {
        ...newC,
        id: "c" + Date.now(),
        proposedBy: user.id,
        status: "pending",
        createdAt: "09/05",
      },
    ]);
    setNewC({ patientId: "p1", type: "phone", desc: "", reason: "" });
    setShowNew(false);
    toast("✅ Consequence proposed – awaiting manager approval");
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
