import { useState } from "react";
import { C } from "../data/constants";
import { Badge, Card, CT, Alrt, Btn, Modal, FL, FS, FTA } from "../components/ui";

export default function Groups({
  patients,
  groups,
  setGroups,
  attendance,
  setAttendance,
  toast,
}) {
  const [activeGroup, setActiveGroup] = useState(null);
  const [showEvent, setShowEvent] = useState(null);
  const [eventData, setEventData] = useState({
    type: "disturbance",
    desc: "",
  }); /* quick open form (inline, no modal) */
  const [showQuickOpen, setShowQuickOpen] = useState(false);
  const [quickTopic, setQuickTopic] = useState("");
  const [quickTime, setQuickTime] = useState(
    new Date().toTimeString().slice(0, 5),
  );
  const [quickType, setQuickType] = useState("therapeutic");
  const topicRef = { current: null };
  const activePats = patients.filter(
    (p) => p.status === "active" && !p.awayType,
  );
  const cur = groups.find((g) => g.id === activeGroup);
  const groupAtt = attendance.filter((a) => a.sessionId === activeGroup);
  const getAtt = (pid) =>
    groupAtt.find((a) => a.patientId === pid)?.status || "present";
  const cycleAtt = (pid) => {
    const states = ["present", "late", "absent"];
    const next = states[(states.indexOf(getAtt(pid)) + 1) % 3];
    const ex = attendance.find(
      (a) => a.sessionId === activeGroup && a.patientId === pid,
    );
    if (ex)
      setAttendance((prev) =>
        prev.map((a) => (a.id === ex.id ? { ...a, status: next } : a)),
      );
    else
      setAttendance((prev) => [
        ...prev,
        {
          id: "a" + Date.now(),
          sessionId: activeGroup,
          patientId: pid,
          status: next,
        },
      ]);
  };
  const openGroup = () => {
    if (!quickTopic.trim()) {
      toast("⚠️ Please enter a Topic");
      return;
    }
    const id = "g" + Date.now();
    setGroups((prev) => [
      ...prev,
      {
        id,
        topic: quickTopic,
        type: quickType,
        time: quickTime,
        status: "active",
        notes: "",
      },
    ]);
    setActiveGroup(id);
    setShowQuickOpen(false);
    setQuickTopic("");
    toast("✅ Group opened");
  };
  const closeGroup = () => {
    setGroups((prev) =>
      prev.map((g) => (g.id === activeGroup ? { ...g, status: "done" } : g)),
    );
    setActiveGroup(null);
    toast("✅ Group closed");
  };
  const [editGroupId, setEditGroupId] = useState(null);
  const editG = groups.find((g) => g.id === editGroupId);
  const editAtt = attendance.filter((a) => a.sessionId === editGroupId);
  const getEditAtt = (pid) =>
    editAtt.find((a) => a.patientId === pid)?.status || "present";
  const cycleEditAtt = (pid) => {
    const states = ["present", "late", "absent"];
    const next = states[(states.indexOf(getEditAtt(pid)) + 1) % 3];
    const ex = attendance.find(
      (a) => a.sessionId === editGroupId && a.patientId === pid,
    );
    if (ex)
      setAttendance((prev) =>
        prev.map((a) => (a.id === ex.id ? { ...a, status: next } : a)),
      );
    else
      setAttendance((prev) => [
        ...prev,
        {
          id: "a" + Date.now(),
          sessionId: editGroupId,
          patientId: pid,
          status: next,
        },
      ]);
  };
  const [editNote, setEditNote] = useState("");
  const [editEventPat, setEditEventPat] = useState(null);
  const [editEventData, setEditEventData] = useState({
    type: "disturbance",
    desc: "",
  });
  const closeEdit = () => {
    setEditGroupId(null);
  };
  const attPropsEdit = {
    present: { l: "✓ Present", bg: "#e8f8ef", c: C.green },
    late: { l: "⏰ Late", bg: "#fef3e8", c: C.orange },
    absent: { l: "✗ Absent", bg: "#fce8e8", c: C.red },
  };
  const attProps = {
    present: { l: "✓ Present", bg: "#e8f8ef", c: C.green },
    late: { l: "⏰ Late", bg: "#fef3e8", c: C.orange },
    absent: { l: "✗ Absent", bg: "#fce8e8", c: C.red },
  };
  const presentCount = activePats.filter(
    (p) => getAtt(p.id) === "present",
  ).length;
  const absentCount = activePats.filter(
    (p) => getAtt(p.id) === "absent",
  ).length;
  const lateCount = activePats.filter((p) => getAtt(p.id) === "late").length;
  return (
    <div>
      {" "}
      {showEvent && (
        <Modal
          onClose={() => setShowEvent(null)}
          title={`Event – ${patients.find((p) => p.id === showEvent)?.name}`}
          width={360}
        >
          {" "}
          <FL label="Type">
            <FS
              value={eventData.type}
              onChange={(v) => setEventData((e) => ({ ...e, type: v }))}
              options={[
                { v: "exit", l: "🚪 Unauthorized Exit" },
                { v: "disturbance", l: "⚠️ Disruption" },
                { v: "removal", l: "🚫 Withdrawal" },
                { v: "note", l: "📝 Note" },
              ]}
            />
          </FL>{" "}
          <FL label="Description">
            <FTA
              value={eventData.desc}
              onChange={(v) => setEventData((e) => ({ ...e, desc: v }))}
              rows={2}
            />
          </FL>{" "}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            {" "}
            <Btn
              color="orange"
              onClick={() => {
                toast("✅ Event recorded");
                setShowEvent(null);
                setEventData({ type: "disturbance", desc: "" });
              }}
            >
              ✓ Save
            </Btn>{" "}
            <Btn color="outline" onClick={() => setShowEvent(null)}>
              Cancel
            </Btn>{" "}
          </div>{" "}
        </Modal>
      )}{" "}
      {/* ── Active Group ── */}{" "}
      {cur && cur.status === "active" && (
        <div>
          {" "}
          {/* Header */}{" "}
          <div
            style={{
              background: `linear-gradient(135deg,${C.teal},${C.tealLt})`,
              borderRadius: 14,
              padding: 16,
              color: "#fff",
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            {" "}
            <div style={{ flex: 1 }}>
              {" "}
              <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 2 }}>
                {cur.topic}
              </div>{" "}
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                {cur.time} &nbsp;|&nbsp; {activePats.length} Patients
                &nbsp;|&nbsp; ✓ {presentCount} &nbsp; ⏰ {lateCount} &nbsp; ✗{" "}
                {absentCount}
              </div>{" "}
            </div>{" "}
            <Btn color="orange" size="sm" onClick={closeGroup}>
              ✓ Close Group
            </Btn>{" "}
          </div>{" "}
          <Alrt type="teal" icon="💡">
            Default: everyone Present. Tap once to toggle.
          </Alrt>{" "}
          {/* Attendance list – fast single-tap */}{" "}
          <Card style={{ marginBottom: 12 }}>
            {" "}
            {activePats.map((p) => {
              const s = getAtt(p.id);
              const ap = attProps[s];
              return (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "9px 4px",
                    borderBottom: `1px solid ${C.border}`,
                    gap: 10,
                  }}
                >
                  {" "}
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>
                    {p.name}
                  </div>{" "}
                  {/* Event button */}{" "}
                  <button
                    onClick={() => setShowEvent(p.id)}
                    style={{
                      background: "transparent",
                      border: `1px solid ${C.border}`,
                      borderRadius: 16,
                      padding: "3px 8px",
                      fontSize: 11,
                      cursor: "pointer",
                      color: C.soft,
                      fontFamily: "inherit",
                    }}
                  >
                    Event
                  </button>{" "}
                  {/* Attendance cycle button */}{" "}
                  <button
                    onClick={() => cycleAtt(p.id)}
                    style={{
                      minWidth: 90,
                      padding: "5px 10px",
                      borderRadius: 20,
                      fontWeight: 700,
                      fontSize: 12,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      background: ap.bg,
                      color: ap.c,
                      textAlign: "center",
                    }}
                  >
                    {ap.l}
                  </button>{" "}
                </div>
              );
            })}{" "}
          </Card>{" "}
        </div>
      )}{" "}
      {/* ── Open New Group (inline, no modal) ── */}{" "}
      {showQuickOpen && (
        <Card style={{ marginBottom: 14, border: `2px solid ${C.teal}` }}>
          {" "}
          <CT icon="🗣️" bg="#e3f7f8">
            Open Group
          </CT>{" "}
          <div style={{ marginBottom: 10 }}>
            {" "}
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.soft,
                display: "block",
                marginBottom: 4,
              }}
            >
              Group Topic
            </label>{" "}
            <input
              autoFocus
              value={quickTopic}
              onChange={(e) => setQuickTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && openGroup()}
              placeholder="e.g.: Group Therapy, Skills workshop..."
              style={{
                width: "100%",
                padding: "9px 12px",
                border: `2px solid ${C.teal}`,
                borderRadius: 8,
                fontSize: 14,
                fontFamily: "inherit",
                direction: "ltr",
                boxSizing: "border-box",
                fontWeight: 600,
              }}
            />{" "}
          </div>{" "}
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            {" "}
            <div style={{ flex: 1 }}>
              {" "}
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.soft,
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Time
              </label>{" "}
              <input
                value={quickTime}
                onChange={(e) => setQuickTime(e.target.value)}
                type="time"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: "inherit",
                }}
              />{" "}
            </div>{" "}
            <div style={{ flex: 2 }}>
              {" "}
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.soft,
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Type
              </label>{" "}
              <div style={{ display: "flex", gap: 6 }}>
                {" "}
                {[
                  ["therapeutic", "Therapeutic"],
                  ["activity", "active"],
                  ["general", "General"],
                  ["other", "Other"],
                ].map(([v, l]) => (
                  <div
                    key={v}
                    onClick={() => setQuickType(v)}
                    style={{
                      flex: 1,
                      padding: "6px 4px",
                      borderRadius: 8,
                      border: `2px solid ${quickType === v ? C.teal : C.border}`,
                      background: quickType === v ? C.teal : "#fff",
                      color: quickType === v ? "#fff" : C.mid,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    {l}
                  </div>
                ))}{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          <div style={{ display: "flex", gap: 8 }}>
            {" "}
            <Btn color="teal" onClick={openGroup}>
              ▶ Open and mark Attendance
            </Btn>{" "}
            <Btn color="outline" onClick={() => setShowQuickOpen(false)}>
              Cancel
            </Btn>{" "}
          </div>{" "}
        </Card>
      )}{" "}
      {/* ── Group list + Open button ── */}{" "}
      {(!cur || cur.status !== "active") && !showQuickOpen && (
        <div style={{ marginBottom: 14 }}>
          {" "}
          <Btn
            color="teal"
            onClick={() => setShowQuickOpen(true)}
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "12px",
              fontSize: 15,
              borderRadius: 12,
            }}
          >
            {" "}
            + Open New Group{" "}
          </Btn>{" "}
        </div>
      )}{" "}
      {/* ── Edit Closed Group ── */}{" "}
      {editGroupId && editG && (
        <div>
          {" "}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            {" "}
            <button
              onClick={closeEdit}
              style={{
                background: "#f0f2f5",
                border: "none",
                borderRadius: 8,
                padding: "7px 12px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "inherit",
              }}
            >
              ← Back
            </button>{" "}
            <div style={{ fontWeight: 800, fontSize: 16 }}>{editG.topic}</div>{" "}
            <span style={{ fontSize: 12, color: C.soft }}>{editG.time}</span>{" "}
            <Badge type="gray">Closed – editing</Badge>{" "}
          </div>{" "}
          {/* Edit event on patient */}{" "}
          {editEventPat && (
            <Card style={{ marginBottom: 12, border: `2px solid ${C.orange}` }}>
              {" "}
              <CT icon="⚡" bg="#fef3e8">
                Event – {patients.find((p) => p.id === editEventPat)?.name}
              </CT>{" "}
              <FL label="Type">
                <FS
                  value={editEventData.type}
                  onChange={(v) => setEditEventData((e) => ({ ...e, type: v }))}
                  options={[
                    { v: "exit", l: "🚪 Unauthorized Exit" },
                    { v: "disturbance", l: "⚠️ Disruption" },
                    { v: "removal", l: "🚫 Withdrawal" },
                    { v: "note", l: "📝 Note" },
                  ]}
                />
              </FL>{" "}
              <FL label="Description">
                <FTA
                  value={editEventData.desc}
                  onChange={(v) => setEditEventData((e) => ({ ...e, desc: v }))}
                  rows={2}
                />
              </FL>{" "}
              <div style={{ display: "flex", gap: 8 }}>
                {" "}
                <Btn
                  color="orange"
                  size="sm"
                  onClick={() => {
                    toast("✅ Event updated");
                    setEditEventPat(null);
                    setEditEventData({ type: "disturbance", desc: "" });
                  }}
                >
                  ✓ Save Event
                </Btn>{" "}
                <Btn
                  color="outline"
                  size="sm"
                  onClick={() => setEditEventPat(null)}
                >
                  Cancel
                </Btn>{" "}
              </div>{" "}
            </Card>
          )}{" "}
          <Card style={{ marginBottom: 12 }}>
            {" "}
            <CT icon="👥" bg="#e3f7f8">
              Edit Attendance
            </CT>{" "}
            <Alrt type="teal" icon="💡">
              Tap once to toggle Status. Click "Event" to log an Event.
            </Alrt>{" "}
            {activePats.map((p) => {
              const s = getEditAtt(p.id);
              const ap = attPropsEdit[s];
              return (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "9px 4px",
                    borderBottom: `1px solid ${C.border}`,
                    gap: 10,
                  }}
                >
                  {" "}
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>
                    {p.name}
                  </div>{" "}
                  <button
                    onClick={() => {
                      setEditEventPat(p.id);
                      setEditEventData({ type: "disturbance", desc: "" });
                    }}
                    style={{
                      background: "transparent",
                      border: `1px solid ${C.border}`,
                      borderRadius: 16,
                      padding: "3px 8px",
                      fontSize: 11,
                      cursor: "pointer",
                      color: C.soft,
                      fontFamily: "inherit",
                    }}
                  >
                    Event
                  </button>{" "}
                  <button
                    onClick={() => cycleEditAtt(p.id)}
                    style={{
                      minWidth: 90,
                      padding: "5px 10px",
                      borderRadius: 20,
                      fontWeight: 700,
                      fontSize: 12,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      background: ap.bg,
                      color: ap.c,
                    }}
                  >
                    {ap.l}
                  </button>{" "}
                </div>
              );
            })}{" "}
          </Card>{" "}
          <Card>
            {" "}
            <CT icon="📝" bg="#f0f2f5">
              Group Notes
            </CT>{" "}
            <FTA
              value={editNote || editG.notes || ""}
              onChange={(v) => {
                setEditNote(v);
                setGroups((prev) =>
                  prev.map((g) =>
                    g.id === editGroupId ? { ...g, notes: v } : g,
                  ),
                );
              }}
              placeholder="General notes about the group..."
              rows={3}
            />{" "}
            <div style={{ marginTop: 10 }}>
              <Btn
                color="teal"
                size="sm"
                onClick={() => {
                  toast("✅ Group updated");
                  closeEdit();
                }}
              >
                ✓ Finish Edit
              </Btn>
            </div>{" "}
          </Card>{" "}
        </div>
      )}{" "}
      {!editGroupId && (
        <Card>
          {" "}
          <CT icon="📋" bg="#f0f2f5">
            Groups Today
          </CT>{" "}
          {groups.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: 16,
                color: C.soft,
                fontSize: 13,
              }}
            >
              No groups yet today
            </div>
          )}{" "}
          {[...groups].reverse().map((g) => (
            <div
              key={g.id}
              onClick={() =>
                g.status === "done"
                  ? setEditGroupId(g.id)
                  : setActiveGroup(g.id)
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 0",
                borderBottom: `1px solid ${C.border}`,
                cursor: "pointer",
              }}
            >
              {" "}
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background:
                    g.status === "done"
                      ? C.soft
                      : g.status === "active"
                        ? C.teal
                        : C.blue,
                  flexShrink: 0,
                }}
              />{" "}
              <div style={{ flex: 1 }}>
                {" "}
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  {g.topic}
                </div>{" "}
                <div style={{ fontSize: 11, color: C.soft }}>{g.time}</div>{" "}
              </div>{" "}
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {" "}
                {g.id === activeGroup && g.status === "active" && (
                  <Badge type="teal">Active now</Badge>
                )}{" "}
                <Badge
                  type={
                    g.status === "done"
                      ? "gray"
                      : g.status === "active"
                        ? "teal"
                        : "blue"
                  }
                >
                  {" "}
                  {g.status === "done"
                    ? "Closed ✏️"
                    : g.status === "active"
                      ? "Active"
                      : "planned"}{" "}
                </Badge>{" "}
              </div>{" "}
            </div>
          ))}{" "}
        </Card>
      )}{" "}
    </div>
  );
}
