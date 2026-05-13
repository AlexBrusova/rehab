import { useState, useEffect } from "react";
import { C, NAV_CFG, TITLES } from "./data/constants";
import useBreakpoint from "./hooks/useBreakpoint";

const toFrontendMed = (m) => ({
  ...m,
  morning: (m.times || []).includes("morning"),
  noon: (m.times || []).includes("noon"),
  evening: (m.times || []).includes("evening"),
  night: (m.times || []).includes("night"),
});
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
  const [archived, setArchived] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [meds, setMeds] = useState([]);
  const [dist, setDist] = useState([]);
  const [phones, setPhones] = useState([]);
  const [phoneHist, setPhoneHist] = useState([]);
  const [groups, setGroups] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [consequences, setConsequences] = useState([]);
  const [finance, setFinance] = useState([]);
  const [cashbox, setCashbox] = useState([]);
  const [cashboxCounts, setCashboxCounts] = useState([]);
  const [therapy, setTherapy] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [dailySummary, setDailySummary] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [therapistAssignments, setTherapistAssignments] = useState({});
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
  const { isMobile } = useBreakpoint();

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
        setMeds(data.flatMap((p) => (p.meds || []).map(toFrontendMed)));
      })
      .catch(console.error);
    authFetch(`/api/rooms?houseId=${activeHouseId}`)
      .then(setRooms)
      .catch(console.error);
    authFetch(`/api/shifts?houseId=${activeHouseId}`)
      .then(setShifts)
      .catch(console.error);
    authFetch(`/api/consequences?houseId=${activeHouseId}`)
      .then(setConsequences)
      .catch(console.error);
    authFetch(`/api/phones?houseId=${activeHouseId}`)
      .then((data) => {
        setPhones(data.filter((p) => p.status === "active"));
        setPhoneHist(data.filter((p) => p.status === "returned"));
      })
      .catch(console.error);
    authFetch(`/api/therapy?houseId=${activeHouseId}`)
      .then(setTherapy)
      .catch(console.error);
    authFetch(`/api/summary?houseId=${activeHouseId}`)
      .then(setDailySummary)
      .catch(console.error);
    authFetch(`/api/groups?houseId=${activeHouseId}`)
      .then((data) => {
        setGroups(data);
        setAttendance(data.flatMap((g) => g.attendance || []));
      })
      .catch(console.error);
    const today = new Date().toLocaleDateString("en-GB");
    authFetch(`/api/finance/patient?houseId=${activeHouseId}`)
      .then(setFinance)
      .catch(console.error);
    authFetch(`/api/finance/cashbox?houseId=${activeHouseId}`)
      .then(setCashbox)
      .catch(console.error);
    authFetch(`/api/finance/cashbox-counts?houseId=${activeHouseId}`)
      .then(setCashboxCounts)
      .catch(console.error);
    authFetch(`/api/distributions?houseId=${activeHouseId}&date=${today}`)
      .then(setDist)
      .catch(console.error);
    authFetch(`/api/patients/archived?houseId=${activeHouseId}`)
      .then(setArchived)
      .catch(console.error);
    authFetch(`/api/therapist-assignments?houseId=${activeHouseId}`)
      .then(setTherapistAssignments)
      .catch(console.error);
    authFetch(`/api/schedule?houseId=${activeHouseId}`)
      .then(setSchedule)
      .catch(console.error);
  }, [user, activeHouseId]);

  const refreshPatients = async () => {
    if (!activeHouseId) return;
    const data = await authFetch(`/api/patients?houseId=${activeHouseId}`);
    setPatients(data);
    setMeds(data.flatMap((p) => (p.meds || []).map(toFrontendMed)));
  };

  const createPatient = async (formData) => {
    const payload = { ...formData, houseId: activeHouseId };
    if (!payload.roomId?.trim()) delete payload.roomId;
    await authFetch("/api/patients", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await refreshPatients();
  };

  const updatePatient = async (id, data) => {
    await authFetch(`/api/patients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    const stateUpdate = { ...data };
    if (data.awayType !== undefined) {
      stateUpdate.status = data.awayType ? "away" : "active";
    }
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...stateUpdate } : p)));
  };

  const markPatientAway = async (patientId, awayType) => {
    await authFetch(`/api/patients/${patientId}`, {
      method: "PATCH",
      body: JSON.stringify({ awayType }),
    });
    setPatients((prev) => prev.map((p) => p.id === patientId ? { ...p, status: "away", awayType } : p));
  };

  const markPatientReturned = async (patientId) => {
    await authFetch(`/api/patients/${patientId}`, {
      method: "PATCH",
      body: JSON.stringify({ awayType: null }),
    });
    setPatients((prev) => prev.map((p) => p.id === patientId ? { ...p, status: "active", awayType: null } : p));
  };

  const archivePatient = async (id, dischargeType) => {
    const dischargeDate = new Date().toLocaleDateString("en-GB").replace(/\//g, "/");
    await authFetch(`/api/patients/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "archived", dischargeType, dischargeDate }),
    });
    setPatients((prev) => prev.filter((p) => p.id !== id));
    authFetch(`/api/patients/archived?houseId=${activeHouseId}`).then(setArchived).catch(console.error);
  };

  const issuePhone = async (patientId, durationMin) => {
    const now = new Date();
    const givenAt = now.toTimeString().slice(0, 5);
    const returnByDate = new Date(now.getTime() + durationMin * 60000);
    const returnBy = returnByDate.toTimeString().slice(0, 5);
    const created = await authFetch("/api/phones", {
      method: "POST",
      body: JSON.stringify({ patientId, givenAt, returnBy }),
    });
    setPhones((prev) => [created, ...prev]);
  };

  const returnPhone = async (id) => {
    const ph = phones.find((p) => p.id === id);
    const returnedAt = new Date().toTimeString().slice(0, 5);
    const late = returnedAt > ph.returnBy;
    const updated = await authFetch(`/api/phones/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "returned", returnedAt, late }),
    });
    setPhones((prev) => prev.filter((p) => p.id !== id));
    setPhoneHist((prev) => [updated, ...prev]);
  };

  const createConsequence = async (data) => {
    const today = new Date().toLocaleDateString("en-GB");
    const created = await authFetch("/api/consequences", {
      method: "POST",
      body: JSON.stringify({ ...data, houseId: activeHouseId, date: today }),
    });
    setConsequences((prev) => [created, ...prev]);
  };

  const updateConsequence = async (id, data) => {
    const updated = await authFetch(`/api/consequences/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    setConsequences((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const createSummary = async (generalText, patientSummaries) => {
    const created = await authFetch("/api/summary", {
      method: "POST",
      body: JSON.stringify({ houseId: activeHouseId, counselorId: user.id, generalText, patientSummaries }),
    });
    setDailySummary((prev) => [created, ...prev]);
  };

  const createMed = async (patientId, medData) => {
    const created = await authFetch("/api/meds", {
      method: "POST",
      body: JSON.stringify({ patientId, ...medData }),
    });
    setMeds((prev) => [...prev, toFrontendMed(created)]);
    return created;
  };

  const updateMed = async (id, medData) => {
    const updated = await authFetch(`/api/meds/${id}`, {
      method: "PATCH",
      body: JSON.stringify(medData),
    });
    setMeds((prev) => prev.map((m) => (m.id === id ? toFrontendMed(updated) : m)));
    return updated;
  };

  const deleteMed = async (id) => {
    await authFetch(`/api/meds/${id}`, { method: "DELETE" });
    setMeds((prev) => prev.filter((m) => m.id !== id));
  };

  const assignTherapist = async (patientId, therapistId) => {
    await authFetch("/api/therapist-assignments", {
      method: "PUT",
      body: JSON.stringify({ patientId, therapistId }),
    });
    setTherapistAssignments((prev) => ({ ...prev, [patientId]: therapistId || null }));
  };

  const assignScheduleDay = async (houseId, date, counselorId, note) => {
    const result = await authFetch("/api/schedule/assign", {
      method: "PUT",
      body: JSON.stringify({ houseId, date, counselorId, note }),
    });
    setSchedule((prev) => {
      const filtered = prev.filter((s) => !(s.houseId === houseId && s.date === date));
      return result ? [...filtered, result] : filtered;
    });
  };

  const setDistributionStatus = async (patientId, shift, date, status) => {
    const record = await authFetch("/api/distributions", {
      method: "PUT",
      body: JSON.stringify({ patientId, shift, date, status }),
    });
    setDist((prev) => {
      const ex = prev.find((d) => d.patientId === patientId && d.shift === shift && d.date === date);
      if (ex) return prev.map((d) => (d === ex ? record : d));
      return [...prev, record];
    });
    return record;
  };

  const createTherapySession = async (data) => {
    const created = await authFetch("/api/therapy", {
      method: "POST",
      body: JSON.stringify({ ...data, therapistId: user.id }),
    });
    setTherapy((prev) => [created, ...prev]);
    return created;
  };

  const createGroup = async (data) => {
    const today = new Date().toLocaleDateString("en-GB");
    const created = await authFetch("/api/groups", {
      method: "POST",
      body: JSON.stringify({ ...data, houseId: activeHouseId, date: today }),
    });
    setGroups((prev) => [...prev, created]);
    return created;
  };

  const updateGroup = async (id, data) => {
    const updated = await authFetch(`/api/groups/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    setGroups((prev) => prev.map((g) => (g.id === id ? updated : g)));
    return updated;
  };

  const upsertAttendance = async (groupId, patientId, status) => {
    const record = await authFetch(`/api/groups/${groupId}/attendance`, {
      method: "PUT",
      body: JSON.stringify({ patientId, status }),
    });
    setAttendance((prev) => {
      const ex = prev.find((a) => a.sessionId === groupId && a.patientId === patientId);
      if (ex) return prev.map((a) => (a.id === ex.id ? record : a));
      return [...prev, record];
    });
    return record;
  };

  const createPatientTx = async (patientId, type, amount, cat, note, currentBalance) => {
    const newBal = type === "deposit" ? currentBalance + amount : currentBalance - amount;
    const date = new Date().toLocaleDateString("en-GB");
    const created = await authFetch("/api/finance/patient", {
      method: "POST",
      body: JSON.stringify({ patientId, type, amount, cat, note, date, balance: newBal }),
    });
    setFinance((prev) => [created, ...prev]);
    return created;
  };

  const createCashTx = async (houseId, type, amount, cat, note, currentBalance) => {
    const newBal = type === "deposit" ? currentBalance + amount : currentBalance - amount;
    const date = new Date().toLocaleDateString("en-GB");
    const time = new Date().toTimeString().slice(0, 5);
    const created = await authFetch("/api/finance/cashbox", {
      method: "POST",
      body: JSON.stringify({ houseId, type, amount, cat, note, date, time, by: user.name, balance: newBal }),
    });
    setCashbox((prev) => [created, ...prev]);
    return created;
  };

  const createCashboxCount = async (houseId, amount, expected, diff, notes) => {
    const date = new Date().toLocaleDateString("en-GB");
    const time = new Date().toTimeString().slice(0, 5);
    const created = await authFetch("/api/finance/cashbox-counts", {
      method: "POST",
      body: JSON.stringify({ houseId, countedBy: user.name, amount, expected, diff, date, time, notes }),
    });
    setCashboxCounts((prev) => [created, ...prev]);
    return created;
  };

  const createShift = async (data) => {
    const created = await authFetch("/api/shifts", {
      method: "POST",
      body: JSON.stringify({ ...data, houseId: activeHouseId, counselorId: user.id }),
    });
    setShifts((prev) => [created, ...prev]);
    return created;
  };

  const updateShift = async (id, data) => {
    const updated = await authFetch(`/api/shifts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    setShifts((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  };

  const createRoom = async (data) => {
    const created = await authFetch("/api/rooms", {
      method: "POST",
      body: JSON.stringify({ ...data, houseId: activeHouseId }),
    });
    setRooms((prev) => [...prev, created]);
  };

  const updateRoom = async (id, data) => {
    const updated = await authFetch(`/api/rooms/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    setRooms((prev) => prev.map((r) => (r.id === id ? updated : r)));
  };

  const deleteRoom = async (id) => {
    await authFetch(`/api/rooms/${id}`, { method: "DELETE" });
    setRooms((prev) => prev.filter((r) => r.id !== id));
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
  /** While `/api/houses` is still loading, `activeHouse` is undefined but `activeHouseId` is already set — keep filtering by id. */
  const houseScopeId = activeHouse?.id || activeHouseId;
  const canSwitchHouses =
    allowedHouses.length > 1; /* Filter data by active house */
  const housePatients = patients.filter((p) => p.houseId === houseScopeId);
  const houseRooms = rooms.filter((r) => r.houseId === houseScopeId);
  const houseShifts = shifts.filter(
    (s) => s.houseId === houseScopeId,
  ); /* Filter additional data by House */
  const housePatientIds = new Set(housePatients.map((p) => p.id));
  const houseMeds = meds.filter((m) => housePatientIds.has(m.patientId));
  const houseGroups = groups.filter(
    (g) => !g.houseId || g.houseId === houseScopeId,
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
        meds={houseMeds}
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
        onAddMed={createMed}
        onSaveMed={updateMed}
        onRemoveMed={deleteMed}
      />
    ),
    rooms: (
      <Rooms
        rooms={houseRooms}
        setRooms={setRooms}
        patients={housePatients}
        setPatients={setPatients}
        toast={showToast}
        onAddRoom={createRoom}
        onUpdateRoom={updateRoom}
        onDeleteRoom={deleteRoom}
        onUpdatePatient={updatePatient}
      />
    ),
    absences: (
      <Absences
        patients={housePatients}
        user={user}
        toast={showToast}
        onMarkAway={markPatientAway}
        onReturn={markPatientReturned}
      />
    ),
    medmanager: (
      <MedManager
        patients={housePatients}
        meds={houseMeds}
        user={user}
        toast={showToast}
        onAddMed={createMed}
        onSaveMed={updateMed}
        onRemoveMed={deleteMed}
      />
    ),
    medications: (
      <Medications
        patients={housePatients}
        meds={houseMeds}
        dist={dist}
        user={user}
        toast={showToast}
        onSetStatus={setDistributionStatus}
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
        onCreateGroup={createGroup}
        onUpdateGroup={updateGroup}
        onUpsertAttendance={upsertAttendance}
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
        onIssue={issuePhone}
        onReturn={returnPhone}
      />
    ),
    summary: (
      <Summary
        patients={housePatients}
        groups={houseGroups}
        dailySummary={dailySummary}
        user={user}
        toast={showToast}
        onSave={createSummary}
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
        onCreateShift={createShift}
        onUpdateShift={updateShift}
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
        onAdd={createConsequence}
        onUpdate={updateConsequence}
      />
    ),
    finance: (
      <Finance
        patients={housePatients}
        finance={houseFinance}
        cashbox={cashbox}
        cashboxCounts={cashboxCounts}
        user={user}
        toast={showToast}
        activeHouseId={houseScopeId}
        onAddPatientTx={createPatientTx}
        onAddCashTx={createCashTx}
        onAddCashboxCount={createCashboxCount}
      />
    ),
    manage: (
      <Manage
        users={users}
        setUsers={setUsers}
        patients={housePatients}
        user={user}
        toast={showToast}
        schedule={schedule}
        onAssignSchedule={assignScheduleDay}
        therapistAssignments={therapistAssignments}
        onAssignTherapist={assignTherapist}
        onMarkAway={markPatientAway}
        onReturn={markPatientReturned}
        shifts={houseShifts}
        activeHouseId={houseScopeId}
        houses={houses}
        onAddUser={createUser}
        onUpdateUser={updateUser}
      />
    ),
    therapy: (
      <Therapy
        patients={housePatients}
        therapy={houseTherapy}
        user={user}
        toast={showToast}
        onAddSession={createTherapySession}
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
            paddingTop: "calc(18px + env(safe-area-inset-top))",
            paddingLeft: 16,
            paddingRight: 16,
            paddingBottom: 14,
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
                  data-testid={`nav-${item.id}`}
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
            paddingBottom: "calc(11px + env(safe-area-inset-bottom))",
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
      {/* MAIN */}{" "}
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
            paddingTop: "env(safe-area-inset-top)",
            paddingLeft: 16,
            paddingRight: 16,
            paddingBottom: 0,
            minHeight: 56,
            display: "flex",
            alignItems: "center",
            gap: 10,
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          {" "}
          {/* Hamburger - only on mobile */}{" "}
          <button
            data-testid="sidebar-toggle"
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
            data-testid="page-title"
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
          {!isMobile && <Badge
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
          </Badge>}{" "}
          {!isMobile && <div
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
            <div style={{ width: 5, height: 5, background: "#fff", borderRadius: "50%" }} />
            Active shift
          </div>}{" "}
        </div>{" "}
        <div style={{ padding: "16px", paddingBottom: "calc(16px + env(safe-area-inset-bottom))", flex: 1, overflowY: "auto" }}>
          {" "}
          {screenEl[screen] || screenEl.dashboard}{" "}
        </div>{" "}
      </main>{" "}
    </div>
  );
}
