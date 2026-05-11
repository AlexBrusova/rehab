import { useState } from "react";
import { C } from "../data/constants";
import { Card, CT, Btn, Modal, FL, FI } from "../components/ui";

export default function ScheduleTab({
  users,
  schedule,
  setSchedule,
  isOrgManager,
  activeHouseId,
  toast,
}) {
  const [selMonth, setSelMonth] = useState("2025-05");
  const prevMonth = () => {
    const [y, m] = selMonth.split("-");
    const d = new Date(+y, +m - 2, 1);
    setSelMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
  };
  const nextMonth = () => {
    const [y, m] = selMonth.split("-");
    const d = new Date(+y, +m, 1);
    setSelMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
  };
  const [selDay, setSelDay] = useState(null); /* Date selected */
  const [slotData, setSlotData] = useState({ counselorId: "", note: "" });
  const assignDay = (ds, counselorId, note = "") => {
    /* Delete existing slot for this day if any */
    setSchedule((prev) => [
      ...prev.filter((s) => !(s.houseId === activeHouseId && s.date === ds)),
      ...(counselorId
        ? [
            {
              id: "sc" + Date.now(),
              houseId: activeHouseId,
              counselorId,
              date: ds,
              shift: "24h",
              note,
            },
          ]
        : []),
    ]);
    setSelDay(null);
  };
  const houseSchedule = schedule.filter(
    (s) => s.houseId === activeHouseId && s.date.startsWith(selMonth),
  );
  const counselors = users.filter(
    (u) =>
      u.role === "counselor" && (u.allowedHouses || []).includes(activeHouseId),
  ); /* Unique color per Counselor */
  const colorMap = {};
  counselors.forEach((u, i) => {
    colorMap[u.id] = COUNSELOR_COLORS[i % COUNSELOR_COLORS.length];
  });
  const daysInMonth = new Date(selMonth + "-01");
  const days = [];
  const d = new Date(daysInMonth);
  while (d.getMonth() === daysInMonth.getMonth()) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  const shiftCount = (uid) =>
    houseSchedule.filter((s) => s.counselorId === uid).length;
  const exportExcel = () => {
    /* Build CSV for Excel download */
    const header = ["Date", "Counselor", "Shift Type", "Note"];
    const rows = houseSchedule.map((s) => {
      const u = users.find((x) => x.id === s.counselorId);
      return [
        s.date,
        u?.name || "",
        s.note && s.note !== "partial" ? "24 hours" : "partial",
        s.note || "",
      ];
    });
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Shift_Schedule_${selMonth}.csv`;
    a.click();
    toast("📥 Excel file downloaded");
  };
  return (
    <div>
      {" "}
      {/* Summary Number of Shifts */}{" "}
      <Card style={{ marginBottom: 14 }}>
        {" "}
        <CT icon="📊" bg="#e3f7f8">
          Number of Shifts – {selMonth}
        </CT>{" "}
        {counselors.map((u) => (
          <div
            key={u.id}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "9px 0",
              borderBottom: `1px solid ${C.border}`,
              gap: 12,
            }}
          >
            {" "}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: colorMap[u.id],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 900,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {u.initials}
            </div>{" "}
            <div style={{ flex: 1 }}>
              {" "}
              <div style={{ fontWeight: 700, fontSize: 13 }}>{u.name}</div>{" "}
              <div style={{ fontSize: 11, color: C.soft }}>
                Total this month: {shiftCount(u.id)} Shifts
              </div>{" "}
            </div>{" "}
            <div
              style={{
                background: shiftCount(u.id) > 0 ? "#e3f7f8" : "#f0f2f5",
                color: shiftCount(u.id) > 0 ? C.teal : C.soft,
                borderRadius: 20,
                padding: "4px 14px",
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              {shiftCount(u.id)}
            </div>{" "}
          </div>
        ))}{" "}
      </Card>{" "}
      {/* Popup on day click */}{" "}
      {selDay && (
        <Modal
          onClose={() => setSelDay(null)}
          title={`📅 ${selDay} – Counselor Assignment`}
          width={340}
        >
          {" "}
          <FL label="Select Counselor">
            {" "}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {" "}
              {counselors.map((u) => {
                const col = colorMap[u.id];
                const isCurrent = houseSchedule.find(
                  (s) => s.date === selDay && s.counselorId === u.id,
                );
                return (
                  <button
                    key={u.id}
                    onClick={() => assignDay(selDay, u.id, slotData.note)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: `2px solid ${isCurrent ? col : C.border}`,
                      background: isCurrent ? col + "22" : "#fff",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "right",
                    }}
                  >
                    {" "}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: col,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 900,
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      {u.initials}
                    </div>{" "}
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: isCurrent ? col : C.text,
                      }}
                    >
                      {u.name}
                    </span>{" "}
                    {isCurrent && (
                      <span
                        style={{
                          marginRight: "auto",
                          fontSize: 11,
                          color: col,
                          fontWeight: 700,
                        }}
                      >
                        ✓ Defined
                      </span>
                    )}{" "}
                  </button>
                );
              })}{" "}
              <button
                onClick={() => assignDay(selDay, null)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: `2px solid ${C.red}`,
                  background: "#fff5f5",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 700,
                  fontSize: 12,
                  color: C.red,
                }}
              >
                {" "}
                🗑️ Clear This Day{" "}
              </button>{" "}
            </div>{" "}
          </FL>{" "}
          <FL label="Note (partial shift)">
            {" "}
            <FI
              value={slotData.note}
              onChange={(v) => setSlotData((d) => ({ ...d, note: v }))}
              placeholder="e.g.: until 15:00 only"
            />{" "}
          </FL>{" "}
        </Modal>
      )}{" "}
      {/* Buttons */}{" "}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {" "}
        <Btn color="outline" onClick={exportExcel}>
          📥 Export Excel
        </Btn>{" "}
      </div>{" "}
      {/* Monthly Schedule */}{" "}
      <Card>
        {" "}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          {" "}
          <button
            onClick={prevMonth}
            style={{
              background: "transparent",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "4px 10px",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 12,
            }}
          >
            ◀
          </button>{" "}
          <div
            style={{
              flex: 1,
              textAlign: "center",
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            {selMonth}
          </div>{" "}
          <button
            onClick={nextMonth}
            style={{
              background: "transparent",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "4px 10px",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 12,
            }}
          >
            ▶
          </button>{" "}
        </div>{" "}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7,1fr)",
            gap: 3,
          }}
        >
          {" "}
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div
              key={d}
              style={{
                textAlign: "center",
                fontSize: 10,
                fontWeight: 700,
                color: C.soft,
                padding: "4px 0",
              }}
            >
              {d}
            </div>
          ))}{" "}
          {Array(days[0]?.getDay() || 0)
            .fill(null)
            .map((_, i) => (
              <div key={"e" + i} />
            ))}{" "}
          {days.map((day) => {
            const ds = day.toISOString().slice(0, 10);
            const daySlots = houseSchedule.filter((s) => s.date === ds);
            return (
              <div
                key={ds}
                onClick={() => isOrgManager && setSelDay(ds)}
                style={{
                  minHeight: 54,
                  border: `1px solid ${daySlots.length > 0 ? C.teal : C.border}`,
                  borderRadius: 6,
                  padding: "3px 4px",
                  background: daySlots.length > 0 ? "#f0fafa" : "#fff",
                  cursor: isOrgManager ? "pointer" : "default",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (isOrgManager)
                    e.currentTarget.style.background =
                      daySlots.length > 0 ? "#e0f4f5" : "#f7f9fc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    daySlots.length > 0 ? "#f0fafa" : "#fff";
                }}
              >
                {" "}
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: C.soft,
                    marginBottom: 2,
                  }}
                >
                  {day.getDate()}
                </div>{" "}
                {daySlots.map((s) => {
                  const u = users.find((x) => x.id === s.counselorId);
                  const col = colorMap[s.counselorId] || C.teal;
                  return (
                    <div
                      key={s.id}
                      title={u?.name || ""}
                      style={{
                        background: col,
                        color: "#fff",
                        borderRadius: 4,
                        padding: "2px 5px",
                        fontSize: 9,
                        fontWeight: 700,
                        marginBottom: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {" "}
                      {u?.name?.split(" ")[0] || "?"}
                      {s.note && " *"}{" "}
                    </div>
                  );
                })}{" "}
                {isOrgManager && daySlots.length === 0 && (
                  <div style={{ fontSize: 8, color: "#ccc", marginTop: 2 }}>
                    +
                  </div>
                )}{" "}
              </div>
            );
          })}{" "}
        </div>{" "}
        {/* Legend */}{" "}
        <div
          style={{
            marginTop: 12,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            borderTop: `1px solid ${C.border}`,
            paddingTop: 8,
          }}
        >
          {" "}
          {counselors.map((u) => (
            <div
              key={u.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
              }}
            >
              {" "}
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: colorMap[u.id],
                  flexShrink: 0,
                }}
              />{" "}
              <span style={{ fontWeight: 600 }}>{u.name}</span>{" "}
              <span style={{ color: C.soft }}>({shiftCount(u.id)})</span>{" "}
            </div>
          ))}{" "}
        </div>{" "}
        <div style={{ marginTop: 6, fontSize: 10, color: C.soft }}>
          * = partial shift / replacement
        </div>{" "}
      </Card>{" "}
    </div>
  );
}
