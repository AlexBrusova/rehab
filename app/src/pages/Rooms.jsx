import { useState } from "react";
import { C } from "../data/constants";
import { Badge, Card, CT, Btn, Modal, FL, FI, FS } from "../components/ui";
import useBreakpoint from "../hooks/useBreakpoint";

export default function Rooms({
  rooms,
  setRooms,
  patients,
  setPatients,
  toast,
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom,
  onUpdatePatient,
}) {
  const { isMobile } = useBreakpoint();
  const [showAdd, setShowAdd] = useState(false);
  const [openRoom, setOpenRoom] = useState(null); /* room id currently "open" */
  const [newR, setNewR] = useState({
    number: "",
    building: "Building A",
    capacity: "1",
  });
  const [editingRoom, setEditingRoom] = useState(false);
  const [editData, setEditData] = useState({});
  const [movePatId, setMovePatId] = useState("");
  const [moveToRoomId, setMoveToRoomId] = useState("");
  const buildings = [...new Set(rooms.map((r) => r.building))];
  const room = rooms.find((r) => r.id === openRoom);
  const occ = openRoom ? patients.filter((p) => p.roomId === openRoom) : [];
  const unassigned = patients.filter((p) => p.status === "active" && !p.roomId);
  const addRoom = async () => {
    if (!newR.number || !newR.building) {
      toast("⚠️ Please fill building and room number");
      return;
    }
    try {
      await onAddRoom(newR);
      setNewR({ number: "", building: "Building A", capacity: "1" });
      setShowAdd(false);
      toast("✅ Room added");
    } catch {
      toast("❌ Failed to add room");
    }
  };
  const saveEdit = async () => {
    try {
      await onUpdateRoom(openRoom, editData);
      setEditingRoom(false);
      toast("✅ Room updated");
    } catch {
      toast("❌ Failed to update room");
    }
  };
  const deleteRoom = async () => {
    if (occ.length > 0) {
      toast("⚠️ Please remove patients before deleting");
      return;
    }
    try {
      await onDeleteRoom(openRoom);
      setOpenRoom(null);
      toast("🗑️ Room deleted");
    } catch {
      toast("❌ Failed to delete room");
    }
  };
  const vacatePatient = async (patId) => {
    try {
      await onUpdatePatient(patId, { roomId: null });
      toast("✅ Patient removed from room");
    } catch {
      toast("❌ Failed to update patient");
    }
  };
  const movePatient = async () => {
    if (!movePatId || !moveToRoomId) {
      toast("⚠️ Select Patient and Room first");
      return;
    }
    const target = rooms.find((r) => r.id === moveToRoomId);
    const targetOcc = patients.filter((p) => p.roomId === moveToRoomId).length;
    if (targetOcc >= target.capacity) {
      toast(`⚠️ ${target.number} Full`);
      return;
    }
    try {
      await onUpdatePatient(movePatId, { roomId: moveToRoomId });
      setMovePatId("");
      setMoveToRoomId("");
      toast(`✅ Patient moved to ${target.number}`);
    } catch {
      toast("❌ Failed to move patient");
    }
  };
  const assignToRoom = async (patId) => {
    if (!patId) return;
    const cur = rooms.find((r) => r.id === openRoom);
    if (occ.length >= cur.capacity) {
      toast("⚠️ Room is Full");
      return;
    }
    try {
      await onUpdatePatient(patId, { roomId: openRoom });
      toast("✅ Patient assigned to Room");
    } catch {
      toast("❌ Failed to assign patient");
    }
  }; /* ── Inner screen – Open Room ── */
  if (openRoom && room) {
    const allOtherRooms = rooms.filter((r) => r.id !== openRoom);
    const canAdd = occ.length < room.capacity;
    return (
      <div>
        {" "}
        {/* Header */}{" "}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {" "}
          <button
            onClick={() => {
              setOpenRoom(null);
              setEditingRoom(false);
            }}
            style={{
              background: "#f0f2f5",
              border: "none",
              borderRadius: 8,
              padding: "7px 12px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            ← Back
          </button>{" "}
          <div style={{ fontSize: 18, fontWeight: 900 }}>
            {room.number} &nbsp;
            <span style={{ fontSize: 13, color: C.soft, fontWeight: 400 }}>
              {room.building}
            </span>
          </div>{" "}
          <Badge
            type={
              occ.length === 0
                ? "green"
                : occ.length >= room.capacity
                  ? "red"
                  : "teal"
            }
          >
            {occ.length}/{room.capacity} Patients
          </Badge>{" "}
          <div style={{ marginRight: "auto", display: "flex", gap: 8 }}>
            {" "}
            <Btn
              color="outline"
              size="sm"
              onClick={() => {
                setEditingRoom(true);
                setEditData({
                  number: room.number,
                  building: room.building,
                  capacity: room.capacity,
                });
              }}
            >
              ✏️ Edit
            </Btn>{" "}
            <Btn color="red" size="sm" onClick={deleteRoom}>
              🗑️ Delete Room
            </Btn>{" "}
          </div>{" "}
        </div>{" "}
        {/* Edit form */}{" "}
        {editingRoom && (
          <Card style={{ marginBottom: 16, border: `2px solid ${C.teal}` }}>
            {" "}
            <CT icon="✏️" bg="#e3f7f8">
              Edit Room Details
            </CT>{" "}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 80px",
                gap: 10,
                marginBottom: 12,
              }}
            >
              {" "}
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.soft,
                    display: "block",
                    marginBottom: 3,
                  }}
                >
                  Building
                </label>
                <FI
                  value={editData.building || ""}
                  onChange={(v) => setEditData((d) => ({ ...d, building: v }))}
                />
              </div>{" "}
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.soft,
                    display: "block",
                    marginBottom: 3,
                  }}
                >
                  Room Number
                </label>
                <FI
                  value={editData.number || ""}
                  onChange={(v) => setEditData((d) => ({ ...d, number: v }))}
                />
              </div>{" "}
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.soft,
                    display: "block",
                    marginBottom: 3,
                  }}
                >
                  Capacity
                </label>
                <FI
                  value={editData.capacity || ""}
                  onChange={(v) => setEditData((d) => ({ ...d, capacity: v }))}
                  type="number"
                />
              </div>{" "}
            </div>{" "}
            <div style={{ display: "flex", gap: 8 }}>
              <Btn color="teal" size="sm" onClick={saveEdit}>
                ✓ Save
              </Btn>
              <Btn
                color="outline"
                size="sm"
                onClick={() => setEditingRoom(false)}
              >
                Cancel
              </Btn>
            </div>{" "}
          </Card>
        )}{" "}
        <div
          style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}
        >
          {" "}
          {/* Current occupants */}{" "}
          <Card>
            {" "}
            <CT icon="👥" bg="#e8f0fb">
              Patients in Room
            </CT>{" "}
            {occ.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: 20,
                  color: C.soft,
                  fontSize: 13,
                  fontStyle: "italic",
                }}
              >
                Room is vacant
              </div>
            )}{" "}
            {occ.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 0",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                {" "}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg,${C.teal},${C.blue})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
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
                <div style={{ flex: 1 }}>
                  {" "}
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {p.name}
                  </div>{" "}
                  <div style={{ fontSize: 11, color: C.soft }}>
                    {p.days} Days in Center
                  </div>{" "}
                </div>{" "}
                {p.status === "away" && (
                  <Badge type="yellow" style={{ fontSize: 10 }}>
                    🏠 {p.awayType}
                  </Badge>
                )}{" "}
                <Btn
                  color="outline"
                  size="sm"
                  onClick={() => vacatePatient(p.id)}
                >
                  Clear
                </Btn>{" "}
              </div>
            ))}{" "}
            {/* Add unassigned patient */}{" "}
            {canAdd && unassigned.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                {" "}
                <select
                  onChange={(e) => assignToRoom(e.target.value)}
                  defaultValue=""
                  style={{
                    flex: 1,
                    padding: "7px 10px",
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: "inherit",
                    direction: "ltr",
                  }}
                >
                  {" "}
                  <option value="">+ Add Patient without a Room</option>{" "}
                  {unassigned.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}{" "}
                </select>{" "}
              </div>
            )}{" "}
            {canAdd && unassigned.length === 0 && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: C.soft,
                  textAlign: "center",
                }}
              >
                All Patients assigned to Rooms
              </div>
            )}{" "}
          </Card>{" "}
          {/* Move patient */}{" "}
          <Card>
            {" "}
            <CT icon="🔄" bg="#fef3e8">
              Transfer Patient to Another Room
            </CT>{" "}
            {occ.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 20,
                  color: C.soft,
                  fontSize: 13,
                }}
              >
                No patients in room
              </div>
            ) : (
              <>
                {" "}
                <FL label="Select Patient to Transfer">
                  {" "}
                  <FS
                    value={movePatId}
                    onChange={setMovePatId}
                    options={[
                      { v: "", l: "-- Select Patient --" },
                      ...occ.map((p) => ({ v: p.id, l: p.name })),
                    ]}
                  />{" "}
                </FL>{" "}
                <FL label="Room first">
                  {" "}
                  <FS
                    value={moveToRoomId}
                    onChange={setMoveToRoomId}
                    options={[
                      { v: "", l: "-- Select Room --" },
                      ...allOtherRooms.map((r) => {
                        const c = patients.filter(
                          (p) => p.roomId === r.id,
                        ).length;
                        return {
                          v: r.id,
                          l: `${r.number} (${r.building}) – ${c}/${r.capacity}${c >= r.capacity ? " 🔴" : ""}`,
                        };
                      }),
                    ]}
                  />{" "}
                </FL>{" "}
                <Btn color="orange" onClick={movePatient}>
                  🔄 Transfer
                </Btn>{" "}
              </>
            )}{" "}
            <div
              style={{
                marginTop: 16,
                borderTop: `1px solid ${C.border}`,
                paddingTop: 14,
              }}
            >
              {" "}
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.mid,
                  marginBottom: 8,
                }}
              >
                All Rooms in Center
              </div>{" "}
              {rooms.map((r) => {
                const c = patients.filter((p) => p.roomId === r.id).length;
                return (
                  <div
                    key={r.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "5px 0",
                      borderBottom: `1px solid ${C.border}`,
                      fontSize: 12,
                    }}
                  >
                    {" "}
                    <span
                      style={{
                        fontWeight: r.id === openRoom ? 800 : 400,
                        color: r.id === openRoom ? C.blue : C.text,
                      }}
                    >
                      {r.number} {r.id === openRoom && "← here"}
                    </span>{" "}
                    <span style={{ color: C.soft, fontSize: 11 }}>
                      {r.building}
                    </span>{" "}
                    <Badge
                      type={
                        c === 0 ? "green" : c >= r.capacity ? "red" : "teal"
                      }
                    >
                      {c}/{r.capacity}
                    </Badge>{" "}
                  </div>
                );
              })}{" "}
            </div>{" "}
          </Card>{" "}
        </div>{" "}
      </div>
    );
  } /* ── Main Screen – Room Map ── */
  return (
    <div>
      {" "}
      {showAdd && (
        <Modal onClose={() => setShowAdd(false)} title="🏠 Add Room">
          {" "}
          <FL label="Building">
            <FI
              value={newR.building}
              onChange={(v) => setNewR((r) => ({ ...r, building: v }))}
              placeholder="Building A"
            />
          </FL>{" "}
          <FL label="Room Number">
            <FI
              value={newR.number}
              onChange={(v) => setNewR((r) => ({ ...r, number: v }))}
              placeholder="Room 5"
            />
          </FL>{" "}
          <FL label="Capacity (Patients)">
            <FI
              value={newR.capacity}
              onChange={(v) => setNewR((r) => ({ ...r, capacity: v }))}
              placeholder="2"
              type="number"
            />
          </FL>{" "}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Btn color="teal" onClick={addRoom}>
              ✓ Add
            </Btn>
            <Btn color="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Btn>
          </div>{" "}
        </Modal>
      )}{" "}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        {" "}
        <div
          style={{
            fontSize: 13,
            color: C.mid,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {" "}
          <span>
            <strong style={{ color: C.green }}>
              {
                rooms.filter((r) => patients.some((p) => p.roomId === r.id))
                  .length
              }
            </strong>{" "}
            occupied
          </span>{" "}
          <span>
            <strong style={{ color: C.soft }}>
              {
                rooms.filter((r) => !patients.some((p) => p.roomId === r.id))
                  .length
              }
            </strong>{" "}
            Vacant
          </span>{" "}
          {unassigned.length > 0 && (
            <span style={{ color: C.orange, fontWeight: 700 }}>
              ⚠️ {unassigned.length} without a Room
            </span>
          )}{" "}
        </div>{" "}
        <Btn color="teal" size="sm" onClick={() => setShowAdd(true)}>
          + Add Room
        </Btn>{" "}
      </div>{" "}
      {buildings.map((bld) => (
        <div key={bld} style={{ marginBottom: 24 }}>
          {" "}
          <div
            style={{
              background: `linear-gradient(135deg,${C.blue},${C.blueLt})`,
              borderRadius: 10,
              padding: "7px 16px",
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
              marginBottom: 12,
              display: "inline-block",
            }}
          >
            🏢 {bld}
          </div>{" "}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
              gap: 12,
            }}
          >
            {" "}
            {rooms
              .filter((r) => r.building === bld)
              .map((room) => {
                const occ = patients.filter((p) => p.roomId === room.id);
                const full = occ.length >= room.capacity;
                const empty = occ.length === 0;
                return (
                  <div
                    key={room.id}
                    onClick={() => setOpenRoom(room.id)}
                    style={{
                      background: C.card,
                      borderRadius: 12,
                      border: `2px solid ${empty ? "#c8e6c9" : full ? "#ffcdd2" : C.border}`,
                      padding: 14,
                      cursor: "pointer",
                      transition: "box-shadow 0.2s, transform 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow =
                        "0 4px 16px rgba(0,0,0,0.12)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    {" "}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      {" "}
                      <div style={{ fontWeight: 800, fontSize: 14 }}>
                        {room.number}
                      </div>{" "}
                      <Badge type={empty ? "green" : full ? "red" : "teal"}>
                        {occ.length}/{room.capacity}
                      </Badge>{" "}
                    </div>{" "}
                    {empty ? (
                      <div
                        style={{
                          fontSize: 11,
                          color: C.soft,
                          fontStyle: "italic",
                          textAlign: "center",
                          padding: "6px 0",
                        }}
                      >
                        Vacant
                      </div>
                    ) : (
                      occ.map((p) => (
                        <div
                          key={p.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 0",
                            borderBottom: `1px solid ${C.border}`,
                          }}
                        >
                          {" "}
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              background: `linear-gradient(135deg,${C.teal},${C.blue})`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 9,
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
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              flex: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {p.name}
                          </span>{" "}
                        </div>
                      ))
                    )}{" "}
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 10,
                        color: C.soft,
                        textAlign: "center",
                      }}
                    >
                      Click for Management ←
                    </div>{" "}
                  </div>
                );
              })}{" "}
          </div>{" "}
        </div>
      ))}{" "}
    </div>
  );
}
