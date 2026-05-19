import { useState } from "react";
import { C } from "../data/constants";
import { V } from "../data/validationLimits";
import { sanitizePersonName, sanitizePhoneInput } from "../lib/inputSanitize";
import { userFullNameRules, usernameRules } from "../lib/fieldRules";
import { Badge, Card, CT, Btn, Modal, FL, FI, FS } from "../components/ui";
import useBreakpoint from "../hooks/useBreakpoint";
import ScheduleTab from "./ScheduleTab";
import TherapistTab from "./TherapistTab";
import AbsenceForm from "./AbsenceForm";

export default function Manage({
  users,
  setUsers,
  patients,
  user: currentUser,
  toast,
  schedule,
  onAssignSchedule,
  therapistAssignments,
  onAssignTherapist,
  onMarkAway,
  onReturn,
  activeHouseId,
  houses,
  onAddUser,
  onUpdateUser,
  t = (k) => k,
  dir = "ltr",
}) {
  const { isMobile } = useBreakpoint();
  const [tab, setTab] = useState("staff");
  const [showAdd, setShowAdd] = useState(false);
  const [editPerms, setEditPerms] = useState(null); /* user id being edited */
  const [newU, setNewU] = useState({
    name: "",
    username: "",
    role: "counselor",
    phone: "",
    allowedHouses: [],
    allHousesAccess: false,
  });
  const [editUser, setEditUser] = useState(null);
  const [editData, setEditData] = useState({});
  const saveEdit = async () => {
    if (!editData.name) {
      toast(t('manage.toastNameRequired'));
      return;
    }
    try {
      await onUpdateUser(editUser, editData);
      setEditUser(null);
      toast(t('manage.toastDetailsUpdated'));
    } catch {
      toast(t('manage.toastUpdateFailed'));
    }
  };
  const isOrgManager = currentUser.role === "org_manager";
  const canEditSchedule = currentUser.role === "org_manager" || currentUser.role === "manager";
  const addUser = async () => {
    if (!newU.name || !newU.username) {
      toast(t('manage.toastNameUsernameRequired'));
      return;
    }
    try {
      await onAddUser({ ...newU, color: C.teal });
      setNewU({ name: "", username: "", role: "counselor", phone: "", allowedHouses: [], allHousesAccess: false });
      setShowAdd(false);
      toast(t('manage.toastAddSuccess'));
    } catch {
      toast(t('manage.toastAddFailed'));
    }
  };
  const toggleUser = (id) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u)),
    );
  };
  const toggleHouse = (uid, hid) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== uid) return u;
        const cur = u.allowedHouses || [];
        const next = cur.includes(hid)
          ? cur.filter((h) => h !== hid)
          : [...cur, hid];
        return { ...u, allowedHouses: next };
      }),
    );
  };
  const toggleAllHouses = (uid) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== uid) return u;
        const newVal = !u.allHousesAccess;
        return {
          ...u,
          allHousesAccess: newVal,
          allowedHouses: newVal
            ? houses.map((h) => h.id)
            : u.allowedHouses,
        };
      }),
    );
  };
  const roleColors = {
    counselor: { bg: "#e3f7f8", c: C.teal },
    doctor: { bg: "#f0e8fb", c: C.purple },
    therapist: { bg: "#fef3e8", c: C.orange },
    manager: { bg: "#e8f0fb", c: C.blue },
    org_manager: { bg: "#f0e8fb", c: C.purple },
  };
  return (
    <div>
      {" "}
      {showAdd && (
        <Modal onClose={() => setShowAdd(false)} title={t('manage.addStaffTitle')}>
          {" "}
          <FL label={t('manage.nameLabel')}>
            <FI
              value={newU.name}
              onChange={(v) => setNewU((u) => ({ ...u, name: v }))}
              placeholder={t('manage.namePlaceholder')}
              {...userFullNameRules}
              maxLength={V.NAME_MAX}
              dir={dir}
            />
          </FL>{" "}
          <FL label={t('manage.usernameLabel')}>
            <FI
              value={newU.username}
              onChange={(v) => setNewU((u) => ({ ...u, username: v }))}
              placeholder={t('manage.usernamePlaceholder')}
              {...usernameRules}
              maxLength={V.USERNAME_MAX}
              autoCapitalize="none"
              spellCheck={false}
              dir={dir}
            />
          </FL>{" "}
          <FL label={t('manage.phoneLabel')}>
            <FI
              value={newU.phone}
              onChange={(v) => setNewU((u) => ({ ...u, phone: v }))}
              placeholder={t('manage.phonePlaceholder')}
              sanitize={sanitizePhoneInput}
              maxLength={V.SHORT_LABEL}
              inputMode="tel"
              dir={dir}
            />
          </FL>{" "}
          <FL label={t('manage.roleLabel')}>
            <FS
              value={newU.role}
              onChange={(v) => setNewU((u) => ({ ...u, role: v }))}
              options={[
                { v: "counselor", l: t('manage.roleCounselor') },
                { v: "doctor", l: t('manage.roleDoctor') },
                { v: "therapist", l: t('manage.roleTherapist') },
                { v: "manager", l: t('manage.roleManager') },
                { v: "org_manager", l: t('manage.roleOrgManager') },
              ]}
              dir={dir}
            />
          </FL>{" "}
          <FL label={t('manage.accessHousesLabel')}>
            {" "}
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 8,
              }}
            >
              {" "}
              {houses.map((h) => {
                const sel = (newU.allowedHouses || []).includes(h.id);
                return (
                  <div
                    key={h.id}
                    onClick={() => {
                      const cur = newU.allowedHouses || [];
                      setNewU((u) => ({
                        ...u,
                        allowedHouses: sel
                          ? cur.filter((x) => x !== h.id)
                          : [...cur, h.id],
                      }));
                    }}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 20,
                      border: `2px solid ${sel ? C.teal : C.border}`,
                      background: sel ? C.teal : "#fff",
                      color: sel ? "#fff" : C.mid,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {h.name}
                  </div>
                );
              })}{" "}
            </div>{" "}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {" "}
              <input
                type="checkbox"
                checked={newU.allHousesAccess}
                onChange={() =>
                  setNewU((u) => ({
                    ...u,
                    allHousesAccess: !u.allHousesAccess,
                    allowedHouses: !u.allHousesAccess
                      ? houses.map((h) => h.id)
                      : u.allowedHouses,
                  }))
                }
              />{" "}
              <span style={{ fontWeight: 700, color: C.teal }}>
                {t('manage.accessHousesLabel')}
              </span>{" "}
            </label>{" "}
          </FL>{" "}
          <div
            style={{
              background: "#fff8f0",
              border: `1px solid #f5c07a`,
              borderRadius: 8,
              padding: "9px 12px",
              fontSize: 12,
              color: "#8b4800",
              marginBottom: 14,
            }}
          >
            {t('manage.initialPassword')}
          </div>{" "}
          <div style={{ display: "flex", gap: 10 }}>
            <Btn color="teal" onClick={addUser}>
              {t('manage.addButton')}
            </Btn>
            <Btn color="outline" onClick={() => setShowAdd(false)}>
              {t('manage.cancelButton')}
            </Btn>
          </div>{" "}
        </Modal>
      )}{" "}
      {/* Edit permissions modal */}{" "}
      {editPerms &&
        (() => {
          const eu = users.find((u) => u.id === editPerms);
          if (!eu) return null;
          return (
            <Modal
              onClose={() => setEditPerms(null)}
              title={`${t('manage.permissionsTitle')} ${eu.name}`}
              width={380}
            >
              {" "}
              <div style={{ marginBottom: 14 }}>
                {" "}
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.soft,
                    marginBottom: 8,
                  }}
                >
                  {t('manage.accessHousesSubtitle')}
                </div>{" "}
                {houses.map((h) => {
                  const has = (eu.allowedHouses || []).includes(h.id);
                  return (
                    <div
                      key={h.id}
                      onClick={() =>
                        !eu.allHousesAccess && toggleHouse(eu.id, h.id)
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 12px",
                        borderRadius: 10,
                        border: `2px solid ${has ? C.teal : C.border}`,
                        background: has ? "#e3f7f8" : "#fff",
                        marginBottom: 8,
                        cursor: eu.allHousesAccess ? "not-allowed" : "pointer",
                        opacity: eu.allHousesAccess ? 0.6 : 1,
                      }}
                    >
                      {" "}
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: has ? C.teal : "#fff",
                          border: `2px solid ${has ? C.teal : C.border}`,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {" "}
                        {has && (
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "#fff",
                            }}
                          />
                        )}{" "}
                      </div>{" "}
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: h.color,
                        }}
                      >
                        {h.name}
                      </span>{" "}
                      <span style={{ fontSize: 11, color: C.soft }}>
                        {h.city}
                      </span>{" "}
                    </div>
                  );
                })}{" "}
              </div>{" "}
              <div
                style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}
              >
                {" "}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    padding: "9px 12px",
                    borderRadius: 10,
                    border: `2px solid ${eu.allHousesAccess ? C.purple : C.border}`,
                    background: eu.allHousesAccess ? "#f0e8fb" : "#fff",
                  }}
                >
                  {" "}
                  <input
                    type="checkbox"
                    checked={!!eu.allHousesAccess}
                    onChange={() => toggleAllHouses(eu.id)}
                  />{" "}
                  <span
                    style={{ fontWeight: 700, fontSize: 13, color: C.purple }}
                  >
                    {t('manage.allHousesAccess')}
                  </span>{" "}
                </label>{" "}
              </div>{" "}
              <div style={{ marginTop: 14 }}>
                <Btn
                  color="teal"
                  onClick={() => {
                    setEditPerms(null);
                    toast(t('manage.toastPermissionsUpdated'));
                  }}
                >
                  {t('manage.saveButton')}
                </Btn>
              </div>{" "}
            </Modal>
          );
        })()}{" "}
      {/* Edit user modal */}{" "}
      {editUser && (
        <Modal
          onClose={() => setEditUser(null)}
          title={t('manage.editUserTitle')}
          width={380}
        >
          {" "}
          <FL label={t('manage.nameLabel')}>
            <FI
              value={editData.name || ""}
              onChange={(v) => setEditData((d) => ({ ...d, name: v }))}
              sanitize={sanitizePersonName}
              maxLength={V.NAME_MAX}
              dir={dir}
            />
          </FL>{" "}
          <FL label={t('manage.phoneLabel')}>
            <FI
              value={editData.phone || ""}
              onChange={(v) => setEditData((d) => ({ ...d, phone: v }))}
              placeholder={t('manage.phonePlaceholder')}
              sanitize={sanitizePhoneInput}
              maxLength={V.SHORT_LABEL}
              inputMode="tel"
              dir={dir}
            />
          </FL>{" "}
          <FL label={t('manage.roleLabel')}>
            <FS
              value={editData.role || "counselor"}
              onChange={(v) =>
                setEditData((d) => ({
                  ...d,
                  role: v,
                  roleLabel: {
                    counselor: t('manage.roleCounselor'),
                    doctor: t('manage.roleDoctor'),
                    therapist: t('manage.roleTherapist'),
                    manager: t('manage.roleManager'),
                    org_manager: t('manage.roleOrgManager'),
                  }[v],
                }))
              }
              options={[
                { v: "counselor", l: t('manage.roleCounselor') },
                { v: "doctor", l: t('manage.roleDoctor') },
                { v: "therapist", l: t('manage.roleTherapist') },
                { v: "manager", l: t('manage.roleManager') },
                { v: "org_manager", l: t('manage.roleOrgManager') },
              ]}
              dir={dir}
            />
          </FL>{" "}
          <div
            style={{
              background: "#e3f7f8",
              border: "1px solid #7dd4d7",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12,
              color: "#054548",
              marginBottom: 14,
            }}
          >
            {t('manage.usernameLocked')}
          </div>{" "}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Btn color="teal" onClick={saveEdit}>
              {t('manage.saveButton')}
            </Btn>
            <Btn color="outline" onClick={() => setEditUser(null)}>
              {t('manage.cancelButton')}
            </Btn>
          </div>{" "}
        </Modal>
      )}{" "}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "#f0f2f5",
          borderRadius: 10,
          padding: 4,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        {" "}
        {[
          ["staff", t('manage.staffTab')],
          ["schedule", t('manage.scheduleTab')],
          ["therapist", t('manage.therapistTab')],
          ["absences", t('manage.absencesTab')],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "none",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              background: tab === v ? "#fff" : "transparent",
              color: tab === v ? C.text : C.soft,
              boxShadow: tab === v ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {l}
          </button>
        ))}{" "}
      </div>{" "}
      {tab === "staff" && (
        <>
          {" "}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 14,
            }}
          >
            <Btn color="teal" size="sm" onClick={() => setShowAdd(true)}>
              {t('manage.addStaffButton')}
            </Btn>
          </div>{" "}
          <div
            style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}
          >
            {" "}
            {users.map((u) => {
              const rc = roleColors[u.role] || roleColors.counselor;
              return (
                <div
                  key={u.id}
                  style={{
                    background: C.card,
                    borderRadius: 12,
                    border: `1px solid ${u.active === false ? "#ffcdd2" : C.border}`,
                    padding: 16,
                    opacity: u.active === false ? 0.65 : 1,
                  }}
                >
                  {" "}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    {" "}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: `linear-gradient(135deg,${u.color || C.teal},${C.blueLt})`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      {u.initials}
                    </div>{" "}
                    <div style={{ flex: 1 }}>
                      {" "}
                      <div style={{ fontWeight: 800, fontSize: 13 }}>
                        {u.name}
                      </div>{" "}
                      <div
                        style={{
                          display: "flex",
                          gap: 5,
                          marginTop: 2,
                          flexWrap: "wrap",
                        }}
                      >
                        {" "}
                        <span
                          style={{
                            background: rc.bg,
                            color: rc.c,
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {u.roleLabel}
                        </span>{" "}
                        {u.active === false && (
                          <Badge type="red">{t('manage.noActiveStatus')}</Badge>
                        )}{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                  {/* House access badges */}{" "}
                  <div
                    style={{
                      marginBottom: 8,
                      display: "flex",
                      gap: 4,
                      flexWrap: "wrap",
                    }}
                  >
                    {" "}
                    {u.allHousesAccess ? (
                      <span
                        style={{
                          background: "#f0e8fb",
                          color: C.purple,
                          padding: "2px 8px",
                          borderRadius: 12,
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {t('manage.allHousesAccess')}
                      </span>
                    ) : (
                      (u.allowedHouses || []).map((hid) => {
                        const h = houses.find((x) => x.id === hid);
                        return h ? (
                          <span
                            key={hid}
                            style={{
                              background: "#e3f7f8",
                              color: C.teal,
                              padding: "2px 8px",
                              borderRadius: 12,
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            {h.name}
                          </span>
                        ) : null;
                      })
                    )}{" "}
                    {!(u.allowedHouses || []).length && !u.allHousesAccess && (
                      <span style={{ fontSize: 10, color: C.soft }}>
                        {t('manage.noAccessHouses')}
                      </span>
                    )}{" "}
                  </div>{" "}
                  <div
                    style={{ fontSize: 11, color: C.soft, marginBottom: 10 }}
                  >
                    {u.phone && `📱 ${u.phone}`}
                  </div>{" "}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {" "}
                    {isOrgManager && (
                      <button
                        onClick={() => {
                          setEditUser(u.id);
                          setEditData({
                            name: u.name,
                            username: u.username,
                            phone: u.phone || "",
                            role: u.role,
                            roleLabel: u.roleLabel,
                          });
                        }}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 8,
                          border: `1.5px solid ${C.border}`,
                          background: "#fff",
                          color: C.mid,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        {t('manage.editButton')}
                      </button>
                    )}{" "}
                    {isOrgManager && (
                      <button
                        onClick={() => setEditPerms(u.id)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 8,
                          border: `1.5px solid ${C.blue}`,
                          background: "#e8f0fb",
                          color: C.blue,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        {t('manage.permissionsButton')}
                      </button>
                    )}{" "}
                    {isOrgManager && (
                      <button
                        onClick={() => toggleUser(u.id)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 8,
                          border: `1.5px solid ${u.active === false ? C.green : C.red}`,
                          background: "transparent",
                          color: u.active === false ? C.green : C.red,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        {u.active === false ? t('manage.activateButton') : t('manage.issueButton')}
                      </button>
                    )}{" "}
                    {isOrgManager && (
                      <button
                        onClick={() => toast(t('manage.toastPasswordReset'))}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 8,
                          border: `1.5px solid ${C.border}`,
                          background: "transparent",
                          color: C.mid,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        {t('manage.resetPasswordButton')}
                      </button>
                    )}{" "}
                  </div>{" "}
                </div>
              );
            })}{" "}
          </div>{" "}
        </>
      )}{" "}
      {tab === "schedule" && (
        <ScheduleTab
          users={users}
          schedule={schedule}
          onAssignSchedule={onAssignSchedule}
          isOrgManager={canEditSchedule}
          activeHouseId={activeHouseId}
          toast={toast}
          t={t}
          dir={dir}
        />
      )}{" "}
      {tab === "therapist" && (
        <TherapistTab
          users={users}
          patients={patients}
          therapistAssignments={therapistAssignments}
          onAssignTherapist={onAssignTherapist}
          t={t}
          dir={dir}
        />
      )}{" "}
      {tab === "absences" && (
        <div>
          {" "}
          {/* Active absences */}{" "}
          <Card style={{ marginBottom: 16 }}>
            {" "}
            <CT icon="🏠" bg="#fef9e7">
              {t('manage.patientsOutsideTitle')}
            </CT>{" "}
            {patients.filter((p) => p.status === "away").length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: 16,
                  color: C.soft,
                  fontSize: 13,
                }}
              >
                {t('manage.noPatientAway')}
              </div>
            )}{" "}
            {patients
              .filter((p) => p.status === "away")
              .map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 0",
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
                      background: `linear-gradient(135deg,${C.orange},#e07b39)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    {" "}
                    {p.awayType === "Home Visit" ? "🏠" : "🛒"}{" "}
                  </div>{" "}
                  <div style={{ flex: 1 }}>
                    {" "}
                    <div style={{ fontWeight: 700, fontSize: 13 }}>
                      {p.name}
                    </div>{" "}
                    <div style={{ fontSize: 12, color: C.soft }}>
                      {p.awayType}
                    </div>{" "}
                  </div>{" "}
                  <Badge type="yellow">{t('manage.outsideStatus')}</Badge>{" "}
                  <Btn
                    color="teal"
                    size="sm"
                    onClick={async () => {
                      try {
                        await onReturn(p.id);
                        toast(`✅ ${p.name} returned to center`);
                      } catch { toast(t('manage.toastReturnFailed')); }
                    }}
                  >
                    {t('manage.confirmReturnButton')}
                  </Btn>{" "}
                </div>
              ))}{" "}
          </Card>{" "}
          <Card>
            {" "}
            <CT icon="📤" bg="#e8f0fb">
              {t('manage.confirmNewAbsenceTitle')}
            </CT>{" "}
            <AbsenceForm
              patients={patients.filter((p) => p.status === "active")}
              onMarkAway={onMarkAway}
              toast={toast}
              t={t}
              dir={dir}
            />{" "}
          </Card>{" "}
        </div>
      )}{" "}
    </div>
  );
}
