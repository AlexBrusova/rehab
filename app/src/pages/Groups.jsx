import { useState } from "react";
import { C } from "../data/constants";
import { V } from "../data/validationLimits";
import { sanitizeFreeText, sanitizeTopic } from "../lib/inputSanitize";
import { Badge, Card, CT, Alrt, Btn, Modal, FL, FS, FTA } from "../components/ui";

export default function Groups({
  t = (k) => k,
  dir = "ltr",
  patients,
  groups,
  setGroups,
  attendance,
  setAttendance,
  toast,
  onCreateGroup,
  onUpdateGroup,
  onUpsertAttendance,
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
    onUpsertAttendance(activeGroup, pid, next).catch(() => toast(t('groups.toastAttendanceFailed')));
  };
  const openGroup = async () => {
    if (!quickTopic.trim()) {
      toast(t('groups.toastTopicRequired'));
      return;
    }
    try {
      const created = await onCreateGroup({ topic: quickTopic, type: quickType, time: quickTime });
      setActiveGroup(created.id);
      setShowQuickOpen(false);
      setQuickTopic("");
      toast(t('groups.toastGroupOpened'));
    } catch { toast(t('groups.toastGroupOpenFailed')); }
  };
  const closeGroup = async () => {
    try {
      await onUpdateGroup(activeGroup, { status: "done" });
      setActiveGroup(null);
      toast(t('groups.toastGroupClosed'));
    } catch { toast(t('groups.toastGroupCloseFailed')); }
  };
  const [editGroupId, setEditGroupId] = useState(null);
  const editG = groups.find((g) => g.id === editGroupId);
  const editAtt = attendance.filter((a) => a.sessionId === editGroupId);
  const getEditAtt = (pid) =>
    editAtt.find((a) => a.patientId === pid)?.status || "present";
  const cycleEditAtt = (pid) => {
    const states = ["present", "late", "absent"];
    const next = states[(states.indexOf(getEditAtt(pid)) + 1) % 3];
    onUpsertAttendance(editGroupId, pid, next).catch(() => toast(t('groups.toastAttendanceFailed')));
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
  const attLabels = {
    present: t('groups.statusPresent'),
    late: t('groups.statusLate'),
    absent: t('groups.statusAbsent'),
  };
  const attColors = {
    present: { bg: "#e8f8ef", c: C.green },
    late: { bg: "#fef3e8", c: C.orange },
    absent: { bg: "#fce8e8", c: C.red },
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
          title={`${t('groups.eventTitle')} ${patients.find((p) => p.id === showEvent)?.name}`}
          width={360}
        >
          {" "}
          <FL label={t('groups.eventTypeLabel')}>
            <FS
              dir={dir}
              value={eventData.type}
              onChange={(v) => setEventData((e) => ({ ...e, type: v }))}
              options={[
                { v: "exit", l: t('groups.eventTypeExit') },
                { v: "disturbance", l: t('groups.eventTypeDisturbance') },
                { v: "removal", l: t('groups.eventTypeRemoval') },
                { v: "note", l: t('groups.eventTypeNote') },
              ]}
            />
          </FL>{" "}
          <FL label={t('groups.descriptionLabel')}>
            <FTA
              dir={dir}
              value={eventData.desc}
              onChange={(v) => setEventData((e) => ({ ...e, desc: v }))}
              rows={2}
              sanitize={sanitizeFreeText}
              maxLength={V.NOTE_MAX}
            />
          </FL>{" "}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            {" "}
            <Btn
              color="orange"
              onClick={() => {
                toast(t('groups.toastEventRecorded'));
                setShowEvent(null);
                setEventData({ type: "disturbance", desc: "" });
              }}
            >
              {t('groups.saveEventButton')}
            </Btn>{" "}
            <Btn color="outline" onClick={() => setShowEvent(null)}>
              {t('groups.cancelButton')}
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
                {cur.time} &nbsp;|&nbsp; {activePats.length} {t('groups.patientsCountLabel')}
                &nbsp;|&nbsp; ✓ {presentCount} &nbsp; ⏰ {lateCount} &nbsp; ✗{" "}
                {absentCount}
              </div>{" "}
            </div>{" "}
            <Btn color="orange" size="sm" onClick={closeGroup}>
              {t('groups.closeGroupButton')}
            </Btn>{" "}
          </div>{" "}
          <Alrt type="teal" icon="💡">
            {t('groups.attendanceDefault')}
          </Alrt>{" "}
          {/* Attendance list – fast single-tap */}{" "}
          <Card style={{ marginBottom: 12 }}>
            {" "}
            {activePats.map((p) => {
              const s = getAtt(p.id);
              const ap = attColors[s];
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
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>
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
                    {t('groups.eventButton')}
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
                    {attLabels[s]}
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
            {t('groups.openGroupTitle')}
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
              {t('groups.groupTopicLabel')}
            </label>{" "}
            <input
              autoFocus
              dir={dir}
              value={quickTopic}
              onChange={(e) => setQuickTopic(sanitizeTopic(e.target.value))}
              onKeyDown={(e) => e.key === "Enter" && openGroup()}
              placeholder={t('groups.groupTopicPlaceholder')}
              maxLength={V.TOPIC_MAX}
              title={t('groups.groupTopicLabel')}
              style={{
                width: "100%",
                padding: "9px 12px",
                border: `2px solid ${C.teal}`,
                borderRadius: 8,
                fontSize: 14,
                fontFamily: "inherit",
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
                {t('groups.timeLabel')}
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
                {t('groups.typeLabel')}
              </label>{" "}
              <div style={{ display: "flex", gap: 6 }}>
                {" "}
                {[
                  ["therapeutic", t('groups.typeTherapeutic')],
                  ["activity", t('groups.typeActivity')],
                  ["general", t('groups.typeGeneral')],
                  ["other", t('groups.typeOther')],
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
              {t('groups.openAndMarkAttendance')}
            </Btn>{" "}
            <Btn color="outline" onClick={() => setShowQuickOpen(false)}>
              {t('groups.cancelButton')}
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
            + {t('groups.openNewGroupButton')}{" "}
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
              {t('groups.editClosedGroupBack')}
            </button>{" "}
            <div style={{ fontWeight: 800, fontSize: 16 }}>{editG.topic}</div>{" "}
            <span style={{ fontSize: 12, color: C.soft }}>{editG.time}</span>{" "}
            <Badge type="gray">{t('groups.editClosedGroupBadge')}</Badge>{" "}
          </div>{" "}
          {/* Edit event on patient */}{" "}
          {editEventPat && (
            <Card style={{ marginBottom: 12, border: `2px solid ${C.orange}` }}>
              {" "}
              <CT icon="⚡" bg="#fef3e8">
                {`${t('groups.eventTitle')} ${patients.find((p) => p.id === editEventPat)?.name}`}
              </CT>{" "}
              <FL label={t('groups.eventTypeLabel')}>
                <FS
                  dir={dir}
                  value={editEventData.type}
                  onChange={(v) => setEditEventData((e) => ({ ...e, type: v }))}
                  options={[
                    { v: "exit", l: t('groups.eventTypeExit') },
                    { v: "disturbance", l: t('groups.eventTypeDisturbance') },
                    { v: "removal", l: t('groups.eventTypeRemoval') },
                    { v: "note", l: t('groups.eventTypeNote') },
                  ]}
                />
              </FL>{" "}
              <FL label={t('groups.descriptionLabel')}>
                <FTA
                  dir={dir}
                  value={editEventData.desc}
                  onChange={(v) => setEditEventData((e) => ({ ...e, desc: v }))}
                  rows={2}
                  sanitize={sanitizeFreeText}
                  maxLength={V.NOTE_MAX}
                />
              </FL>{" "}
              <div style={{ display: "flex", gap: 8 }}>
                {" "}
                <Btn
                  color="orange"
                  size="sm"
                  onClick={() => {
                    toast(t('groups.toastEventUpdated'));
                    setEditEventPat(null);
                    setEditEventData({ type: "disturbance", desc: "" });
                  }}
                >
                  {t('groups.saveEventButton')}
                </Btn>{" "}
                <Btn
                  color="outline"
                  size="sm"
                  onClick={() => setEditEventPat(null)}
                >
                  {t('groups.cancelButton')}
                </Btn>{" "}
              </div>{" "}
            </Card>
          )}{" "}
          <Card style={{ marginBottom: 12 }}>
            {" "}
            <CT icon="👥" bg="#e3f7f8">
              {t('groups.editAttendanceTitle')}
            </CT>{" "}
            <Alrt type="teal" icon="💡">
              {t('groups.editAttendanceTip')}
            </Alrt>{" "}
            {activePats.map((p) => {
              const s = getEditAtt(p.id);
              const ap = attColors[s];
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
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>
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
                    {t('groups.eventButton')}
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
                    {attLabels[s]}
                  </button>{" "}
                </div>
              );
            })}{" "}
          </Card>{" "}
          <Card>
            {" "}
            <CT icon="📝" bg="#f0f2f5">
              {t('groups.groupNotesTitle')}
            </CT>{" "}
            <FTA
              dir={dir}
              value={editNote || editG.notes || ""}
              onChange={(v) => setEditNote(v)}
              placeholder={t('groups.groupNotesPlaceholder')}
              rows={3}
              sanitize={sanitizeFreeText}
              maxLength={V.NOTE_MAX}
            />{" "}
            <div style={{ marginTop: 10 }}>
              <Btn
                color="teal"
                size="sm"
                onClick={async () => {
                  try {
                    await onUpdateGroup(editGroupId, { notes: editNote });
                    toast(t('groups.toastGroupUpdated'));
                    closeEdit();
                  } catch { toast(t('groups.toastGroupUpdateFailed')); }
                }}
              >
                {t('groups.finishEditButton')}
              </Btn>
            </div>{" "}
          </Card>{" "}
        </div>
      )}{" "}
      {!editGroupId && (
        <Card>
          {" "}
          <CT icon="📋" bg="#f0f2f5">
            {t('groups.groupsTodayTitle')}
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
              {t('groups.noGroupsYet')}
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
                  <Badge type="teal">{t('groups.groupsActiveBadge')}</Badge>
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
                    ? t('groups.groupsClosedLabel')
                    : g.status === "active"
                      ? t('groups.statusActiveBadge')
                      : t('groups.statusPlannedBadge')}{" "}
                </Badge>{" "}
              </div>{" "}
            </div>
          ))}{" "}
        </Card>
      )}{" "}
    </div>
  );
}
