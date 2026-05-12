import { useState } from "react";
import { C } from "../data/constants";
import { Badge, Card, CT, Alrt, Btn, FTA, VoiceBtn } from "../components/ui";

export default function Summary({
  patients,
  groups,
  dailySummary,
  user,
  toast,
  onSave,
}) {
  const [texts, setTexts] = useState({
    general: "",
    ...Object.fromEntries(patients.map((p) => [p.id, ""])),
    ...Object.fromEntries(groups.map((g) => [g.id, ""])),
  });
  const setT = (k, v) => setTexts((t) => ({ ...t, [k]: v }));
  const save = async () => {
    try {
      const patientSummaries = Object.fromEntries(patients.map((p) => [p.id, texts[p.id] || ""]));
      await onSave(texts.general, patientSummaries);
      setTexts({ general: "", ...Object.fromEntries(patients.map((p) => [p.id, ""])), ...Object.fromEntries(groups.map((g) => [g.id, ""])) });
      toast("✅ Summary saved – all Staff notified 🔔");
    } catch { toast("❌ Failed to save summary"); }
  };
  return (
    <div>
      {" "}
      <Alrt type="teal" icon="🔔">
        When you Save the Summary –{" "}
        <strong>all Counselors and managers will be notified</strong> witwithin
        the app.
      </Alrt>{" "}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {" "}
        <Card>
          {" "}
          <CT icon="📊" bg="#e3f7f8">
            Summary Groups Today
          </CT>{" "}
          {groups.map((g) => (
            <div
              key={g.id}
              style={{
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                marginBottom: 10,
                overflow: "hidden",
              }}
            >
              {" "}
              <div
                style={{
                  padding: "9px 14px",
                  background: "#f7f9fc",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {" "}
                <span>🗣️</span>
                <strong style={{ fontSize: 13 }}>
                  {g.topic} – {g.time}
                </strong>{" "}
                <Badge
                  type={
                    g.status === "done"
                      ? "gray"
                      : g.status === "active"
                        ? "teal"
                        : "blue"
                  }
                  style={{ marginRight: "auto" }}
                >
                  {g.status === "done" ? "Closed" : "Active"}
                </Badge>{" "}
              </div>{" "}
              <div style={{ padding: 12 }}>
                {" "}
                <div style={{ marginBottom: 6 }}>
                  <VoiceBtn onTranscript={(v) => setT(g.id, v)} />
                </div>{" "}
                <FTA
                  value={texts[g.id] || ""}
                  onChange={(v) => setT(g.id, v)}
                  placeholder="Add Note about the group..."
                  rows={2}
                />{" "}
              </div>{" "}
            </div>
          ))}{" "}
        </Card>{" "}
        <Card>
          {" "}
          <CT icon="📝" bg="#fef3e8">
            General Summary
          </CT>{" "}
          <div style={{ marginBottom: 8 }}>
            <VoiceBtn onTranscript={(v) => setT("general", v)} />
          </div>{" "}
          <FTA
            value={texts.general}
            onChange={(v) => setT("general", v)}
            placeholder="Summarize today: Events unusual, general atmosphere..."
            rows={6}
          />{" "}
        </Card>{" "}
      </div>{" "}
      <Card>
        {" "}
        <CT
          icon="👤"
          bg="#e8f0fb"
          right={
            <Btn color="teal" onClick={save}>
              💾 Save and Send Alert
            </Btn>
          }
        >
          Individual Summary
        </CT>{" "}
        {patients.map((p) => (
          <div
            key={p.id}
            style={{
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              marginBottom: 10,
              overflow: "hidden",
            }}
          >
            {" "}
            <div
              style={{
                padding: "9px 14px",
                background: "#f7f9fc",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              {" "}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg,${C.teal},${C.blue})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {p.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)}
              </div>{" "}
              <strong>{p.name}</strong>{" "}
              <Badge
                type={p.mood >= 7 ? "green" : p.mood >= 4 ? "orange" : "red"}
                style={{ marginRight: 4 }}
              >
                {p.mood}/10
              </Badge>{" "}
              {p.status === "away" && (
                <Badge type="yellow">🏠 {p.awayType}</Badge>
              )}{" "}
              {p.alert && <Badge type="red">⚠ Requires attention</Badge>}{" "}
            </div>{" "}
            <div
              style={{
                padding: 12,
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: 8,
                alignItems: "start",
              }}
            >
              {" "}
              <VoiceBtn onTranscript={(v) => setT(p.id, v)} />{" "}
              <FTA
                value={texts[p.id] || ""}
                onChange={(v) => setT(p.id, v)}
                placeholder={`Daily Summary – ${p.name}...`}
                rows={2}
              />{" "}
            </div>{" "}
          </div>
        ))}{" "}
      </Card>{" "}
      {dailySummary.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          {" "}
          <CT icon="📁" bg="#f0f2f5">
            Previous Summaries
          </CT>{" "}
          {dailySummary.map((s) => (
            <div
              key={s.id}
              style={{
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                padding: 12,
                marginBottom: 8,
              }}
            >
              {" "}
              <div style={{ fontSize: 12, color: C.soft, marginBottom: 4 }}>
                {s.date} | {s.notifiedAt} | Staff notified 🔔
              </div>{" "}
              <div style={{ fontSize: 13 }}>
                {s.generalText || "(No general text)"}
              </div>{" "}
            </div>
          ))}{" "}
        </Card>
      )}{" "}
    </div>
  );
}
