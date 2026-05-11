import { useState, useEffect } from "react";
import { C, pName } from "../data/constants";
import { Badge, Card, CT, Btn, Th, Td, Modal, FL, FS } from "../components/ui";

export default function Phones({
  patients,
  phones,
  setPhones,
  phoneHist,
  setPhoneHist,
  toast,
  onIssue,
  onReturn,
}) {
  const housePatientIds = new Set(patients.map((p) => p.id));
  const housePhones = phones.filter((ph) => housePatientIds.has(ph.patientId));
  const housePhoneHist = phoneHist.filter((ph) => housePatientIds.has(ph.patientId));
  const [showIssue, setShowIssue] = useState(false);
  const [issueData, setIssueData] = useState({ patientId: "", duration: 15 });
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);
  const toMinutes = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const isLate = (ph) => ph.returnBy && nowMin > toMinutes(ph.returnBy);
  const lateCount = housePhones.filter(isLate).length;
  const activePats = patients.filter((p) => p.status === "active");
  const issuePhone = async () => {
    if (!issueData.patientId) { toast("⚠️ Please select a patient"); return; }
    try {
      await onIssue(issueData.patientId, issueData.duration);
      setShowIssue(false);
      toast(`📱 Phone issued to ${pName(patients, issueData.patientId)} for ${issueData.duration} min`);
    } catch { toast("❌ Failed to issue phone"); }
  };
  const returnPhone = async (id) => {
    const ph = phones.find((p) => p.id === id);
    try {
      await onReturn(id);
      toast(`✅ ${pName(patients, ph.patientId)} returned`);
    } catch { toast("❌ Failed to return phone"); }
  };
  return (
    <div>
      {" "}
      {showIssue && (
        <Modal
          onClose={() => setShowIssue(false)}
          title="📱 Issue Phone"
          width={380}
        >
          {" "}
          <FL label="Patient">
            <FS
              value={issueData.patientId}
              onChange={(v) => setIssueData((i) => ({ ...i, patientId: v }))}
              options={activePats.map((p) => ({ v: p.id, l: p.name }))}
            />
          </FL>{" "}
          <FL label="Allocated Time">
            {" "}
            <div style={{ display: "flex", gap: 10 }}>
              {" "}
              {[15, 30].map((d) => (
                <div
                  key={d}
                  onClick={() => setIssueData((i) => ({ ...i, duration: d }))}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 12,
                    border: `2px solid ${issueData.duration === d ? C.teal : C.border}`,
                    background: issueData.duration === d ? "#e3f7f8" : "#fff",
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                >
                  {" "}
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 900,
                      color: issueData.duration === d ? C.teal : C.text,
                    }}
                  >
                    {d}
                  </div>{" "}
                  <div style={{ fontSize: 11, color: C.soft }}>
                    minutes
                  </div>{" "}
                </div>
              ))}{" "}
            </div>{" "}
          </FL>{" "}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Btn color="teal" onClick={issuePhone}>
              ✓ Issued
            </Btn>
            <Btn color="outline" onClick={() => setShowIssue(false)}>
              Cancel
            </Btn>
          </div>{" "}
        </Modal>
      )}{" "}
      {lateCount > 0 && (
        <div
          style={{
            background: "#fce8e8",
            border: `2px solid ${C.red}`,
            borderRadius: 12,
            padding: "14px 18px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {" "}
          <span style={{ fontSize: 24 }}>🚨</span>{" "}
          <div>
            <div style={{ fontWeight: 900, fontSize: 14, color: C.red }}>
              Alert! {lateCount} Patient{lateCount > 1 ? "s" : ""} not returned
              in time
            </div>{" "}
            <div style={{ fontSize: 12, color: "#a00" }}>
              {housePhones
                .filter(isLate)
                .map((ph) => pName(patients, ph.patientId))
                .join(", ")}
            </div>
          </div>{" "}
        </div>
      )}{" "}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {" "}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          {" "}
          <div
            style={{
              background: C.card,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: 16,
              borderRight: `4px solid ${C.teal}`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: C.soft,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              in use now
            </div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>
              {housePhones.length}
            </div>
          </div>{" "}
          <div
            style={{
              background: C.card,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: 16,
              borderRight: `4px solid ${lateCount > 0 ? C.red : C.green}`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: C.soft,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Overdue
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: lateCount > 0 ? C.red : C.green,
              }}
            >
              {lateCount}
            </div>
          </div>{" "}
        </div>{" "}
        <Card style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {" "}
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 3 }}>
              Issued Phone
            </div>
            <div style={{ fontSize: 12, color: C.soft }}>15 or 30 minutes</div>
          </div>{" "}
          <Btn
            color="teal"
            style={{ marginRight: "auto" }}
            onClick={() => setShowIssue(true)}
          >
            📱 Issued
          </Btn>{" "}
        </Card>{" "}
      </div>{" "}
      {housePhones.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          {" "}
          <CT icon="📱" bg="#e3f7f8">
            Phones In Use
          </CT>{" "}
          {housePhones.map((ph) => {
            const givenMin = ph.givenAt ? toMinutes(ph.givenAt) : nowMin;
            const returnMin = ph.returnBy ? toMinutes(ph.returnBy) : givenMin + 30;
            const duration = returnMin - givenMin;
            const el = nowMin - givenMin;
            const rem = returnMin - nowMin;
            const late = isLate(ph);
            const pct = Math.min(100, duration > 0 ? (el / duration) * 100 : 100);
            return (
              <div
                key={ph.id}
                style={{
                  borderRadius: 12,
                  border: `2px solid ${late ? C.red : C.border}`,
                  background: late ? "#fce8e8" : "#fff",
                  padding: 16,
                  marginBottom: 10,
                }}
              >
                {" "}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 10,
                  }}
                >
                  {" "}
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: late
                        ? `linear-gradient(135deg,${C.red},#e74c3c)`
                        : `linear-gradient(135deg,${C.teal},${C.tealLt})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                    }}
                  >
                    📱
                  </div>{" "}
                  <div style={{ flex: 1 }}>
                    {" "}
                    <div style={{ fontWeight: 800, fontSize: 14 }}>
                      {pName(patients, ph.patientId)}
                    </div>{" "}
                    <div style={{ fontSize: 12, color: C.soft }}>
                      Issued: {ph.givenAt} | Return by: {ph.returnBy}
                    </div>{" "}
                  </div>{" "}
                  <div style={{ textAlign: "center" }}>
                    {" "}
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: late
                          ? C.red
                          : el > duration * 0.7
                            ? C.orange
                            : C.teal,
                      }}
                    >
                      {late ? `+${el - duration}` : rem}
                    </div>{" "}
                    <div style={{ fontSize: 10, color: late ? C.red : C.soft }}>
                      {late ? "minutes overdue" : "remaining"}
                    </div>{" "}
                  </div>{" "}
                  <Btn
                    color={late ? "red" : "teal"}
                    size="sm"
                    onClick={() => returnPhone(ph.id)}
                  >
                    ✓ returned
                  </Btn>{" "}
                </div>{" "}
                <div
                  style={{
                    height: 6,
                    background: "#f0f2f5",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  {" "}
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: late ? C.red : pct > 70 ? C.orange : C.teal,
                      borderRadius: 3,
                      transition: "width 0.5s",
                    }}
                  />{" "}
                </div>{" "}
              </div>
            );
          })}{" "}
        </Card>
      )}{" "}
      <Card>
        {" "}
        <CT icon="📋" bg="#f0f2f5">
          History
        </CT>{" "}
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
        >
          <thead>
            <tr>
              <Th>Patient</Th>
              <Th>Date</Th>
              <Th>Issued</Th>
              <Th>Allocated</Th>
              <Th>Returned</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {" "}
            {housePhoneHist.map((r) => (
              <tr key={r.id}>
                {" "}
                <Td style={{ fontWeight: 700 }}>
                  {pName(patients, r.patientId)}
                </Td>{" "}
                <Td style={{ fontSize: 12, color: C.soft }}>{r.date}</Td>{" "}
                <Td>{r.givenAt}</Td> <Td>{r.returnBy}</Td>{" "}
                <Td>{r.returnedAt || "—"}</Td>{" "}
                <Td>
                  <Badge type={r.late ? "orange" : "green"}>
                    {r.late ? "⚠ Late" : "✓ On time"}
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
