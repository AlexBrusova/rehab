import { useState, useEffect } from "react";
import { C, NAV_CFG, TITLES } from "./data/constants";
import { INIT_ARCHIVED, INIT_ROOMS, INIT_DIST, INIT_PHONES, INIT_PHONE_HIST, INIT_GROUPS, INIT_ATTENDANCE, INIT_THERAPIST_ASSIGNMENTS, INIT_SCHEDULE, INIT_CONSEQUENCES, INIT_FINANCE, INIT_CASHBOX, INIT_CASHBOX_COUNTS, INIT_THERAPY, INIT_SHIFTS, INIT_DAILY_SUMMARY } from "./data/initialData";
import { setToken, setStoredUser, getToken, getStoredUser, removeStoredUser, authFetch } from "./lib/api";
import useToast from "./hooks/useToast";
import { Toast, Badge } from "./components/ui";
import Login from "./Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Rooms from "./pages/Rooms";
import MedManager from "./pages/MedManager";
import Medications from "./pages/Medications";
import Groups from "./pages/Groups";
import Phones from "./pages/Phones";
import Summary from "./pages/Summary";
import Shifts from "./pages/Shifts";
import Consequences from "./pages/Consequences";
import Finance from "./pages/Finance";
import Absences from "./pages/Absences";
import Manage from "./pages/Manage";
import Therapy from "./pages/Therapy";

export default function App() {
  const [houses, setHouses] = useState([]);
  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [archived, setArchived] = useState(INIT_ARCHIVED);
  const [rooms, setRooms] = useState(INIT_ROOMS);
  const [meds, setMeds] = useState([]);
  const [dist, setDist] = useState(INIT_DIST);
  const [phones, setPhones] = useState(INIT_PHONES);
  const [phoneHist, setPhoneHist] = useState(INIT_PHONE_HIST);
  const [groups, setGroups] = useState(INIT_GROUPS);
  const [attendance, setAttendance] = useState(INIT_ATTENDANCE);
  const [consequences, setConsequences] = useState(INIT_CONSEQUENCES);
  const [finance, setFinance] = useState(INIT_FINANCE);
  const [cashbox, setCashbox] = useState(INIT_CASHBOX);
  const [cashboxCounts, setCashboxCounts] = useState(INIT_CASHBOX_COUNTS);
  const [therapy, setTherapy] = useState(INIT_THERAPY);
  const [shifts, setShifts] = useState(INIT_SHIFTS);
  const [dailySummary, setDailySummary] = useState(INIT_DAILY_SUMMARY);
  const [schedule, setSchedule] = useState(INIT_SCHEDULE);
  const [therapistAssignments, setTherapistAssignments] = useState(
    INIT_THERAPIST_ASSIGNMENTS,
  );
  const [user, setUser] = useState(() => {
    if (getToken()) return getStoredUser();
    return null;
  });
  const [screen, setScreen] = useState("dashboard");
  const [initialPatientId, setInitialPatientId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navTo = (screenId, patientId = null) => {
    setScreen(screenId);
    setInitialPatientId(patientId);
  };
  const [activeHouseId, setActiveHouseId] = useState(() => {
    const stored = getStoredUser();
    if (!stored) return null;
    const ids = (stored.allowedHouses || []).map((a) => a.houseId || a);
    return ids[0] || stored.houseId || null;
  });
  const [showHousePicker, setShowHousePicker] = useState(false);
  const [toastMsg, showToast] = useToast();

  useEffect(() => {
    if (!user) return;
    authFetch("/api/houses").then(setHouses).catch(console.error);
    authFetch("/api/users").then(setUsers).catch(console.error);
  }, [user]);

  useEffect(() => {
    if (!user || !activeHouseId) return;
    authFetch(`/api/patients?houseId=${activeHouseId}`)
      .then((data) => {
        setPatients(data);
        setMeds(data.flatMap((p) => p.meds || []));
      })
      .catch(console.error);
  }, [user, activeHouseId]);

  const refreshPatients = async () => {
    if (!activeHouseId) return;
    const data = await authFetch(`/api/patients?houseId=${activeHouseId}`);
    setPatients(data);
    setMeds(data.flatMap((p) => p.meds || []));
  };

  const createPatient = async (formData) => {
    await authFetch("/api/patients", {
      method: "POST",
      body: JSON.stringify({ ...formData, houseId: activeHouseId }),
    });
    await refreshPatients();
  };

  const updatePatient = async (id, data) => {
    await authFetch(`/api/patients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  };

  const archivePatient = async (id, dischargeType) => {
    const dischargeDate = new Date().toLocaleDateString("en-GB").replace(/\//g, "/");
    await authFetch(`/api/patients/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "archived", dischargeType, dischargeDate }),
    });
    setPatients((prev) => prev.filter((p) => p.id !== id));
  };

  const ROLE_LABELS = {
    counselor: "Counselor", doctor: "Doctor",
    therapist: "Emotional Therapist", manager: "House Manager", org_manager: "Org Manager",
  };

  const createUser = async (formData) => {
    const initials = formData.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    const roleLabel = ROLE_LABELS[formData.role] || "Counselor";
    const created = await authFetch("/api/users", {
      method: "POST",
      body: JSON.stringify({ ...formData, initials, roleLabel }),
    });
    setUsers((prev) => [...prev, created]);
  };

  const updateUser = async (id, formData) => {
    const data = { ...formData };
    if (formData.name) {
      data.initials = formData.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    }
    if (formData.role) data.roleLabel = ROLE_LABELS[formData.role] || formData.roleLabel;
    const updated = await authFetch(`/api/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
  };

  const handleLogin = (u, token) => {
    setToken(token);
    setStoredUser(u);
    setUser(u);
    setScreen("dashboard");
    const ids = (u.allowedHouses || []).map((a) => a.houseId || a);
    setActiveHouseId(ids[0] || u.houseId || null);
  };

  const handleLogout = () => {
    removeStoredUser();
    setUser(null);
  };

  if (!user)
    return <Login onLogin={handleLogin} />;

  const allowedHouseIds = (user.allowedHouses || []).map((a) => a.houseId || a);
  const allowedHouses = houses.filter(
    (h) => user.allHousesAccess || allowedHouseIds.includes(h.id),
  );
  const activeHouse =
    houses.find((h) => h.id === activeHouseId) ||
    allowedHouses[0] ||
    houses[0];
  const canSwitchHouses =
    allowedHouses.length > 1; /* Filter data by active house */
  const housePatients = patients.filter((p) => p.houseId === activeHouse?.id);
  const houseRooms = rooms.filter((r) => r.houseId === activeHouse?.id);
  const houseShifts = shifts.filter(
    (s) => s.houseId === activeHouse?.id,
  ); /* Filter additional data by House */
  const housePatientIds = new Set(housePatients.map((p) => p.id));
  const houseMeds = meds.filter((m) => housePatientIds.has(m.patientId));
  const houseGroups = groups.filter(
    (g) => !g.houseId || g.houseId === activeHouse?.id,
  );
  const houseConsequences = consequences.filter((c) =>
    housePatientIds.has(c.patientId),
  );
  const houseTherapy = therapy.filter((t) => housePatientIds.has(t.patientId));
  const houseFinance = finance.filter((f) => housePatientIds.has(f.patientId));
  const nav = NAV_CFG[user.role] || NAV_CFG.counselor;
  const shared = {
    patients,
    meds,
    setMeds,
    users,
    therapy,
    user,
    toast: showToast,
  };
  const screenEl = {
    dashboard: (
      <Dashboard
        patients={housePatients}
        meds={houseMeds}
        consequences={houseConsequences}
        therapy={houseTherapy}
        groups={houseGroups}
        shifts={houseShifts}
        users={users}
        phones={phones}
        activeHouse={activeHouse}
        onNav={navTo}
        setPatients={setPatients}
        rooms={houseRooms}
        user={user}
      />
    ),
    patients: (
      <Patients
        patients={housePatients}
        setPatients={setPatients}
        archived={archived}
        setArchived={setArchived}
        meds={houseMeds}
        setMeds={setMeds}
        rooms={houseRooms}
        users={users}
        therapy={houseTherapy}
        user={user}
        toast={showToast}
        initialPatientId={initialPatientId}
        consequences={houseConsequences}
        finance={houseFinance}
        onAddPatient={createPatient}
        onArchivePatient={archivePatient}
        onUpdatePatient={updatePatient}
      />
    ),
    rooms: (
      <Rooms
        rooms={houseRooms}
        setRooms={setRooms}
        patients={housePatients}
        setPatients={setPatients}
        toast={showToast}
      />
    ),
    absences: (
      <Absences
        patients={housePatients}
        setPatients={setPatients}
        user={user}
        toast={showToast}
      />
    ),
    medmanager: (
      <MedManager
        patients={housePatients}
        meds={houseMeds}
        setMeds={setMeds}
        user={user}
        toast={showToast}
      />
    ),
    medications: (
      <Medications
        patients={housePatients}
        meds={houseMeds}
        setMeds={setMeds}
        dist={dist}
        setDist={setDist}
        user={user}
        toast={showToast}
      />
    ),
    groups: (
      <Groups
        patients={housePatients}
        groups={houseGroups}
        setGroups={setGroups}
        attendance={attendance}
        setAttendance={setAttendance}
        toast={showToast}
      />
    ),
    phones: (
      <Phones
        patients={housePatients}
        phones={phones}
        setPhones={setPhones}
        phoneHist={phoneHist}
        setPhoneHist={setPhoneHist}
        toast={showToast}
      />
    ),
    summary: (
      <Summary
        patients={housePatients}
        groups={houseGroups}
        dailySummary={dailySummary}
        setDailySummary={setDailySummary}
        user={user}
        toast={showToast}
      />
    ),
    shifts: (
      <Shifts
        shifts={houseShifts}
        setShifts={setShifts}
        users={users}
        user={user}
        patients={housePatients}
        toast={showToast}
      />
    ),
    consequences: (
      <Consequences
        consequences={houseConsequences}
        setConsequences={setConsequences}
        patients={housePatients}
        users={users}
        user={user}
        toast={showToast}
      />
    ),
    finance: (
      <Finance
        patients={housePatients}
        finance={houseFinance}
        setFinance={setFinance}
        cashbox={cashbox}
        setCashbox={setCashbox}
        cashboxCounts={cashboxCounts}
        setCashboxCounts={setCashboxCounts}
        user={user}
        toast={showToast}
        activeHouseId={activeHouse?.id}
      />
    ),
    manage: (
      <Manage
        users={users}
        setUsers={setUsers}
        patients={housePatients}
        setPatients={setPatients}
        user={user}
        toast={showToast}
        schedule={schedule}
        setSchedule={setSchedule}
        therapistAssignments={therapistAssignments}
        setTherapistAssignments={setTherapistAssignments}
        shifts={houseShifts}
        activeHouseId={activeHouse?.id}
        houses={houses}
        onAddUser={createUser}
        onUpdateUser={updateUser}
      />
    ),
    therapy: (
      <Therapy
        patients={housePatients}
        therapy={houseTherapy}
        setTherapy={setTherapy}
        user={user}
        toast={showToast}
      />
    ),
  };
  const pendingConsequences = consequences.filter(
    (c) => c.status === "pending",
  ).length;
  const latePhonesCount = phones.filter(
    (ph) =>
      Math.floor((new Date() - new Date(ph.issuedAt)) / 60000) > ph.duration,
  ).length;
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: C.bg,
        fontFamily: "'Heebo','Segoe UI',sans-serif",
        direction: "ltr",
      }}
    >
      {" "}
      <Toast msg={toastMsg} /> {/* SIDEBAR */}{" "}
      <aside
        style={{
          width: 218,
          background: C.navy,
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          zIndex: 100,
          boxShadow: "-4px 0 20px rgba(0,0,0,0.3)",
          transform: sidebarOpen ? "translateX(0)" : "translateX(218px)",
          transition: "transform 0.25s ease",
        }}
      >
        {" "}
        <div
          style={{
            padding: "18px 16px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          {" "}
          <div style={{ flex: 1 }}>
            {" "}
            <div
              style={{
                width: 36,
                height: 36,
                background: `linear-gradient(135deg,${C.teal},${C.blueLt})`,
                borderRadius: 9,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                marginBottom: 7,
              }}
            >
              🏥
            </div>{" "}
            <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>
              Phoenix
            </div>{" "}
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.32)" }}>
              Rehab Center Network
            </div>{" "}
            {/* House Switcher in sidebar */}{" "}
            {canSwitchHouses && (
              <div style={{ marginTop: 10, position: "relative" }}>
                {" "}
                <button
                  onClick={() => setShowHousePicker((p) => !p)}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 8,
                    padding: "6px 10px",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 6,
                  }}
                >
                  {" "}
                  <span>🏠 {activeHouse?.name}</span>{" "}
                  <span style={{ opacity: 0.6 }}>▾</span>{" "}
                </button>{" "}
                {showHousePicker && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      left: 0,
                      background: "#fff",
                      borderRadius: 8,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                      zIndex: 200,
                      overflow: "hidden",
                      marginTop: 4,
                    }}
                  >
                    {" "}
                    {allowedHouses.map((h) => (
                      <div
                        key={h.id}
                        onClick={() => {
                          setActiveHouseId(h.id);
                          setShowHousePicker(false);
                          showToast(`🏠 Switched to ${h.name}`);
                        }}
                        style={{
                          padding: "9px 12px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          color: h.id === activeHouseId ? C.teal : C.text,
                          background:
                            h.id === activeHouseId ? "#e3f7f8" : "#fff",
                          borderBottom: `1px solid ${C.border}`,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {" "}
                        {h.id === activeHouseId && (
                          <span style={{ color: C.teal }}>✓</span>
                        )}{" "}
                        {h.name}{" "}
                      </div>
                    ))}{" "}
                  </div>
                )}{" "}
              </div>
            )}{" "}
            {!canSwitchHouses && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 10,
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                {activeHouse?.name}
              </div>
            )}{" "}
          </div>{" "}
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              borderRadius: 7,
              padding: "5px 8px",
              fontSize: 16,
              lineHeight: 1,
              marginTop: 2,
            }}
          >
            ✕
          </button>{" "}
        </div>{" "}
        <nav style={{ flex: 1, padding: "7px 0", overflowY: "auto" }}>
          {" "}
          {nav.map((item) => {
            const dynamicBadge =
              item.id === "consequences"
                ? pendingConsequences
                : item.id === "phones"
                  ? latePhonesCount
                  : item.badge;
            return (
              <div key={item.id}>
                {" "}
                {item.section && (
                  <div
                    style={{
                      padding: "8px 15px 2px",
                      fontSize: 9,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.27)",
                      letterSpacing: "1.4px",
                      textTransform: "uppercase",
                    }}
                  >
                    {item.section}
                  </div>
                )}{" "}
                <div
                  onClick={() => {
                    navTo(item.id);
                    setSidebarOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "8px 17px",
                    color:
                      screen === item.id ? "#fff" : "rgba(255,255,255,0.5)",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 500,
                    background:
                      screen === item.id
                        ? "rgba(45,125,210,0.18)"
                        : "transparent",
                    borderRight: `3px solid ${screen === item.id ? C.blueLt : "transparent"}`,
                    transition: "all 0.15s",
                  }}
                >
                  {" "}
                  <span
                    style={{ fontSize: 14, width: 18, textAlign: "center" }}
                  >
                    {item.icon}
                  </span>{" "}
                  {item.label}{" "}
                  {dynamicBadge > 0 && (
                    <span
                      style={{
                        marginRight: "auto",
                        background: C.red,
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 10,
                      }}
                    >
                      {dynamicBadge}
                    </span>
                  )}{" "}
                </div>{" "}
              </div>
            );
          })}{" "}
        </nav>{" "}
        <div
          style={{
            padding: "11px 13px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 9,
          }}
        >
          {" "}
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: `linear-gradient(135deg,${user.color || C.teal},${C.blueLt})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {user.initials}
          </div>{" "}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.name}
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>
              {user.roleLabel}
            </div>
          </div>{" "}
          <button
            onClick={handleLogout}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              color: "rgba(255,255,255,0.38)",
              cursor: "pointer",
              borderRadius: 6,
              padding: "3px 7px",
              fontSize: 12,
            }}
          >
            ↩
          </button>{" "}
        </div>{" "}
      </aside>{" "}
      {/* BACKDROP when open on mobile */}{" "}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 99,
          }}
        />
      )}{" "}
      {/* MAIN - always full width */}{" "}
      <main
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        {" "}
        <div
          style={{
            background: "#fff",
            borderBottom: `1px solid ${C.border}`,
            padding: "0 16px",
            height: 56,
            display: "flex",
            alignItems: "center",
            gap: 10,
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          {" "}
          {/* Hamburger */}{" "}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px 6px",
              borderRadius: 8,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              flexShrink: 0,
            }}
          >
            {" "}
            <div
              style={{
                width: 20,
                height: 2,
                background: C.text,
                borderRadius: 2,
              }}
            />{" "}
            <div
              style={{
                width: 20,
                height: 2,
                background: C.text,
                borderRadius: 2,
              }}
            />{" "}
            <div
              style={{
                width: 20,
                height: 2,
                background: C.text,
                borderRadius: 2,
              }}
            />{" "}
          </button>{" "}
          <div
            style={{ fontSize: 15, fontWeight: 800, color: C.text, flex: 1 }}
          >
            {TITLES[screen]}
          </div>{" "}
          {/* House indicator in topbar */}{" "}
          {canSwitchHouses ? (
            <button
              onClick={() => {
                setSidebarOpen(true);
              }}
              style={{
                background: "#e3f7f8",
                border: `1px solid #7dd4d7`,
                borderRadius: 20,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 700,
                color: C.teal,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 4,
                whiteSpace: "nowrap",
              }}
            >
              {" "}
              🏠 {activeHouse?.name.split("–")[0].trim()}{" "}
              <span style={{ opacity: 0.6, fontSize: 10 }}>▾</span>{" "}
            </button>
          ) : (
            <div style={{ fontSize: 10, color: C.soft, whiteSpace: "nowrap" }}>
              {activeHouse?.name}
            </div>
          )}{" "}
          <Badge
            type={
              {
                org_manager: "purple",
                manager: "blue",
                doctor: "blue",
                therapist: "orange",
                counselor: "teal",
              }[user.role] || "gray"
            }
          >
            {user.roleLabel}
          </Badge>{" "}
          <div
            style={{
              background: `linear-gradient(135deg,${C.teal},${C.tealLt})`,
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              padding: "4px 9px",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              gap: 3,
              whiteSpace: "nowrap",
            }}
          >
            {" "}
            <div
              style={{
                width: 5,
                height: 5,
                background: "#fff",
                borderRadius: "50%",
              }}
            />{" "}
            Active shift{" "}
          </div>{" "}
        </div>{" "}
        <div style={{ padding: "16px", flex: 1, overflowY: "auto" }}>
          {" "}
          {screenEl[screen] || screenEl.dashboard}{" "}
        </div>{" "}
      </main>{" "}
    </div>
  );
}
