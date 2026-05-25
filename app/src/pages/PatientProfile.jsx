import { useState } from "react";
import { C } from "../data/constants";
import { V } from "../data/validationLimits";
import {
  sanitizeMedDose,
  sanitizeMedName,
} from "../lib/inputSanitize";
import { Badge, Card, CT, Alrt, Btn, Modal, FL, FI, FS } from "../components/ui";
import EditMedRow from "./EditMedRow";
import useBreakpoint from "../hooks/useBreakpoint";

export default function PatientProfile({
  pid,
  patients,
  meds,
  rooms,
  therapy,
  user,
  canEditMeds,
  onClose,
  toast,
  consequences,
  finance,
  onUpdatePatient,
  onMarkAway = () => {},
  onAddMed,
  onSaveMed,
  onRemoveMed,
  t = (k) => k,
  dir = "ltr",
}) {
  const { isMobile } = useBreakpoint();
  const p = patients.find((pt) => pt.id === pid);
  const [tab, setTab] = useState("meds");
  const [editMed, setEditMed] = useState(null);
  const [showAddMed, setShowAddMed] = useState(false);
  const [newMed, setNewMed] = useState({
    name: "", dose: "", unit: "mg",
    morning: false, noon: false, evening: false, night: false,
  });
  const [showAbsence, setShowAbsence] = useState(false);
  const [absData, setAbsData] = useState({ type: t('patientProfile.homeVisit'), returnDate: "" });

  const canManageAbsence = user.role === "manager" || user.role === "counselor";
  const canRequestAbsence = user.role === "counselor" || user.role === "manager";

  const room = rooms.find((r) => r.id === p?.roomId);
  const pMeds = meds.filter((m) => m.patientId === pid);
  const pTherapy = therapy.filter((th) => th.patientId === pid);
  if (!p) return null;

  const saveMed = async (id, upd) => {
    try {
      await onSaveMed(id, upd);
      setEditMed(null);
      toast(t('patientProfile.toastUpdateSuccess'));
    } catch { toast(t('patientProfile.toastUpdateFailed')); }
  };

  const removeMed = async (id) => {
    try {
      await onRemoveMed(id);
      toast(t('patientProfile.toastRemoveSuccess'));
    } catch { toast(t('patientProfile.toastRemoveFailed')); }
  };

  const addMed = async () => {
    if (!newMed.name || !newMed.dose) { toast(t('patientProfile.toastFillNameDose')); return; }
    try {
      await onAddMed(pid, newMed);
      setNewMed({ name: "", dose: "", unit: "mg", morning: false, noon: false, evening: false, night: false });
      setShowAddMed(false);
      toast(t('patientProfile.toastAddSuccess'));
    } catch { toast(t('patientProfile.toastAddFailed')); }
  };

  const openAbsence = async () => {
    if (!absData.returnDate) { toast(t('patientProfile.toastReturnDateRequired')); return; }
    try {
      await onMarkAway(pid, absData.type, absData.returnDate);
      setShowAbsence(false);
      toast(`✅ ${p.name} left for ${absData.type} – back on ${absData.returnDate.replace("T", " ")}`);
    } catch { toast(t('patientProfile.toastAbsenceFailed')); }
  };

  const returnPatient = async () => {
    try {
      await onUpdatePatient(pid, { awayType: null });
      toast(`✅ ${p.name} returned to center`);
    } catch { toast(t('patientProfile.toastReturnFailed')); }
  };

  return (
    <Modal onClose={onClose} title="" width={600}>
      {showAbsence && (
        <Modal onClose={() => setShowAbsence(false)} title={t('patientProfile.confirmLogoutTitle')} width={380}>
          {!canManageAbsence && (
            <Alrt type="teal" icon="ℹ️">{t('patientProfile.absenceNote')}</Alrt>
          )}
          <FL label={t('patientProfile.typeLogoutLabel')}>
            <div style={{ display: "flex", gap: 10 }}>
              {[t('patientProfile.homeVisit'), t('patientProfile.errands'), t('patientProfile.therapyMedical'), t('patientProfile.other')].map((absType) => (
                <div key={absType} onClick={() => setAbsData((d) => ({ ...d, type: absType }))} style={{
                  flex: 1, padding: "8px 6px", borderRadius: 10,
                  border: `2px solid ${absData.type === absType ? C.teal : C.border}`,
                  background: absData.type === absType ? "#e3f7f8" : "#fff",
                  textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700,
                  color: absData.type === absType ? C.teal : C.mid,
                }}>{absType}</div>
              ))}
            </div>
          </FL>
          <FL label={t('patientProfile.dateReturnLabel')}>
            <FI
              type="datetime-local"
              value={absData.returnDate}
              onChange={(v) => setAbsData((d) => ({ ...d, returnDate: v }))}
              dir={dir}
            />
          </FL>
          <div style={{ background: "#fff8f0", border: "1px solid #f5c07a", borderRadius: 8, padding: "9px 12px", fontSize: 12, color: "#8b4800", marginBottom: 14 }}>
            {t('patientProfile.absenceWarning')}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn color="teal" onClick={openAbsence}>{t('patientProfile.markAbsenceButton')}</Btn>
            <Btn color="outline" onClick={() => setShowAbsence(false)}>{t('patientProfile.cancelButton')}</Btn>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,${C.navy},${C.navyMid})`, borderRadius: 12, padding: 20, display: "flex", alignItems: "center", gap: 16, marginBottom: 18, color: "#fff" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg,${C.teal},${C.blueLt})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, flexShrink: 0 }}>
          {p.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 3 }}>{p.name}</div>
          <div style={{ fontSize: 12, opacity: 0.65 }}>
            {p.dob && `${p.dob} | `}{room ? `${room.number} – ${room.building}` : "—"}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            <Badge type="teal">💊 {pMeds.length} {t('patientProfile.medications')}</Badge>
            <Badge type={p.status === "away" ? "yellow" : "green"}>
              {p.status === "away" ? `🏠 ${p.awayType}` : t('patientProfile.activeStatus')}
            </Badge>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          <div style={{ textAlign: "center", background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 16px" }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: "#5dffd5", lineHeight: 1 }}>{p.daysInRehab || "—"}</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>{t('patientProfile.daysInCenter')}</div>
          </div>
          {p.status === "active" && canRequestAbsence && (
            <button onClick={() => setShowAbsence(true)} style={{ background: "rgba(255,165,0,0.2)", border: "1px solid rgba(255,165,0,0.5)", color: "#ffd080", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {t('patientProfile.sendOnVisitButton')}
            </button>
          )}
          {p.status === "away" && canManageAbsence && (
            <button onClick={returnPatient} style={{ background: "rgba(39,174,96,0.2)", border: "1px solid rgba(39,174,96,0.5)", color: "#5dffd5", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {t('patientProfile.confirmReturnButton')}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 3, marginBottom: 16, borderBottom: `2px solid ${C.border}`, overflowX: "auto" }}>
        {[
          ["meds", t('patientProfile.medicationsTab')],
          ["absence", t('patientProfile.absencesTab')],
          ["cons", t('patientProfile.consequencesTab')],
          ["finance", t('patientProfile.financeTab')],
          ["moods", t('patientProfile.moodsTab')],
          ["therapy", t('patientProfile.therapyTab')],
          ["notes", t('patientProfile.notesTab')],
        ].map(([id, l]) => (
          <div key={id} onClick={() => setTab(id)} style={{ padding: "7px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: tab === id ? C.blue : C.soft, borderBottom: `2px solid ${tab === id ? C.blue : "transparent"}`, marginBottom: -2, whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
      </div>

      {/* MEDS TAB */}
      {tab === "meds" && (
        <div>
          {canEditMeds && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
              <Btn color="teal" size="sm" onClick={() => setShowAddMed(true)}>{t('patientProfile.addMedicationButton')}</Btn>
            </div>
          )}
          {showAddMed && (
            <div style={{ background: "#f0fafa", borderRadius: 10, border: `2px solid ${C.teal}`, padding: 14, marginBottom: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 80px", gap: 8, marginBottom: 8 }}>
                <FI
                  value={newMed.name}
                  onChange={(v) => setNewMed((m) => ({ ...m, name: v }))}
                  placeholder={t('patientProfile.medicationNamePlaceholder')}
                  sanitize={sanitizeMedName}
                  maxLength={V.MED_NAME_MAX}
                  dir={dir}
                />
                <FI
                  value={newMed.dose}
                  onChange={(v) => setNewMed((m) => ({ ...m, dose: v }))}
                  placeholder={t('patientProfile.dosePlaceholder')}
                  sanitize={sanitizeMedDose}
                  maxLength={V.MED_DOSE_MAX}
                  dir={dir}
                />
                <FS value={newMed.unit} onChange={(v) => setNewMed((m) => ({ ...m, unit: v }))} options={["mg", "mcg", "ml", "IU", "g"]} dir={dir} />
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                {["morning", "noon", "evening", "night"].map((k, i) => (
                  <div key={k} onClick={() => setNewMed((m) => ({ ...m, [k]: !m[k] }))} style={{ padding: "5px 12px", borderRadius: 20, border: `2px solid ${newMed[k] ? C.teal : C.border}`, background: newMed[k] ? C.teal : "#fff", color: newMed[k] ? "#fff" : C.soft, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    {["Morning", "Noon", "Evening", "Night"][i]}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn color="teal" size="sm" onClick={addMed}>{t('patientProfile.addButton')}</Btn>
                <Btn color="outline" size="sm" onClick={() => setShowAddMed(false)}>{t('patientProfile.cancelButton')}</Btn>
              </div>
            </div>
          )}
          {pMeds.length === 0 && !showAddMed && (
            <div style={{ textAlign: "center", padding: 20, color: C.soft, fontSize: 13 }}>{t('patientProfile.noMedicationsPrescribed')}</div>
          )}
          {pMeds.map((m) => (
            <div key={m.id}>
              {editMed === m.id ? (
                <EditMedRow med={m} onSave={(upd) => saveMed(m.id, upd)} onCancel={() => setEditMed(null)} t={t} dir={dir} />
              ) : (
                <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: "#fff", marginBottom: 8, gap: 10 }}>
                  <span style={{ fontSize: 18 }}>💊</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: C.mid }}>{m.dose}{m.unit}</div>
                  </div>
                  <div style={{ display: "flex", gap: 5 }}>
                    {["Morning", "Noon", "Evening", "Night"].map((label, i) => {
                      const k = ["morning", "noon", "evening", "night"][i];
                      return (
                        <span key={label} style={{ padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: m[k] ? C.teal : "#f0f2f5", color: m[k] ? "#fff" : "#aaa" }}>{label}</span>
                      );
                    })}
                  </div>
                  {canEditMeds && (
                    <div style={{ display: "flex", gap: 5, marginRight: 4 }}>
                      <button onClick={() => setEditMed(m.id)} style={{ padding: "3px 8px", borderRadius: 7, border: `1.5px solid ${C.border}`, background: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700, color: C.mid, fontFamily: "inherit" }}>✏️</button>
                      <button onClick={() => removeMed(m.id)} style={{ padding: "3px 8px", borderRadius: 7, border: "1.5px solid #fcc", background: "#fff5f5", cursor: "pointer", fontSize: 11, fontWeight: 700, color: C.red, fontFamily: "inherit" }}>✕</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ABSENCE TAB */}
      {tab === "absence" && (
        <div>
          {p.status === "away" ? (
            <div style={{ background: `linear-gradient(135deg,${C.orange},${C.orange}cc)`, borderRadius: 12, padding: 18, color: "#fff", marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontSize: 36 }}>🏠</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 3 }}>{p.awayType}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{t('patientProfile.patientOutsideWarning')}</div>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{t('patientProfile.notShownInServices')}</div>
              </div>
              {canManageAbsence && (
                <button onClick={returnPatient} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  {t('patientProfile.confirmReturnButton')}
                </button>
              )}
            </div>
          ) : (
            <div style={{ background: "#e8f8ef", borderRadius: 12, padding: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>✅</span>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: C.green }}>{t('patientProfile.patientInCenter')}</div>
              {canRequestAbsence && (
                <Btn color="orange" size="sm" onClick={() => setShowAbsence(true)}>{t('patientProfile.sendOnVisitButton')}</Btn>
              )}
            </div>
          )}
        </div>
      )}

      {/* CONSEQUENCES TAB */}
      {tab === "cons" && (
        <div>
          {(() => {
            const pCons = (consequences || []).filter((c) => c.patientId === pid);
            const typeLabels = { phone: "📵 Phone Restriction", visit: "🏠 Cancel Home Visit", cigarettes: "🚬 Cigarette Restriction", other: "📝 Other" };
            if (pCons.length === 0) return <div style={{ textAlign: "center", padding: 20, color: C.soft, fontSize: 13 }}>{t('patientProfile.noConsequenceRecords')}</div>;
            return pCons.map((c) => (
              <div key={c.id} style={{ borderRadius: 10, border: `1.5px solid ${c.status === "approved" ? C.orange : c.status === "pending" ? "#f5c07a" : C.border}`, padding: 14, marginBottom: 10, background: c.status === "approved" ? "#fff8f0" : c.status === "pending" ? "#fffbf0" : "#f9f9f9" }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "center" }}>
                  <span style={{ fontWeight: 800, fontSize: 13 }}>{typeLabels[c.type] || c.type}</span>
                  <Badge type={c.status === "approved" ? "orange" : c.status === "pending" ? "yellow" : "gray"}>
                    {c.status === "approved" ? "⛔ Active" : c.status === "pending" ? "⏳ Pending" : t('patientProfile.recordCancelled')}
                  </Badge>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{c.description || c.desc}</div>
                <div style={{ fontSize: 11, color: C.soft }}>{c.date}</div>
              </div>
            ));
          })()}
        </div>
      )}

      {/* FINANCE TAB */}
      {tab === "finance" && (
        <div>
          {(() => {
            const pFin = (finance || []).filter((f) => f.patientId === pid).sort((a, b) => b.id.localeCompare(a.id));
            const balance = pFin.length ? pFin[pFin.length - 1].balance ?? 0 : 0;
            return (
              <>
                <div style={{ background: `linear-gradient(135deg,${C.teal},${C.tealLt})`, borderRadius: 12, padding: 16, color: "#fff", marginBottom: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 4 }}>{t('patientProfile.accountBalance')}</div>
                  <div style={{ fontSize: 32, fontWeight: 900 }}>₪{Number(balance).toLocaleString()}</div>
                </div>
                {pFin.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 16, color: C.soft, fontSize: 13 }}>{t('patientProfile.noFinancialTransactions')}</div>
                ) : (
                  pFin.map((f) => (
                    <div key={f.id} style={{ display: "flex", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.border}`, gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: f.type === "deposit" ? "#e8f8ef" : "#fce8e8", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: f.type === "deposit" ? C.green : C.red, flexShrink: 0 }}>
                        {f.type === "deposit" ? "↑" : "↓"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{f.note || f.cat}</div>
                        <div style={{ fontSize: 11, color: C.soft }}>{f.date}</div>
                      </div>
                      <div style={{ fontWeight: 800, color: f.type === "deposit" ? C.green : C.red }}>
                        {f.type === "deposit" ? "+" : "-"}₪{f.amount}
                      </div>
                    </div>
                  ))
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* MOODS TAB */}
      {tab === "moods" && (
        <div>
          <Card>
            <CT icon="😊" bg="#fef3e8">Current Mood</CT>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24, gap: 16 }}>
              <div style={{ fontSize: 56, fontWeight: 900, color: p.mood >= 7 ? C.teal : p.mood >= 4 ? C.orange : C.red }}>
                {p.mood ?? "—"}
              </div>
              <div style={{ fontSize: 13, color: C.soft }}>
                <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>{t('patientProfile.moodScore')}</div>
                {p.mood >= 7 ? t('patientProfile.moodGood') : p.mood >= 4 ? t('patientProfile.moodModerate') : p.mood ? t('patientProfile.moodLow') : "Not recorded"}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* THERAPY TAB */}
      {tab === "therapy" && (
        <div>
          {pTherapy.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, color: C.soft, fontSize: 13 }}>{t('patientProfile.noScheduledSessions')}</div>
          ) : (
            pTherapy.map((session) => (
              <div key={session.id} style={{ borderRadius: 10, border: `1px solid ${C.border}`, padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 14 }}>🧠</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{session.topic}</div>
                    <div style={{ fontSize: 12, color: C.soft }}>{session.date}</div>
                  </div>
                  <Badge type={{ NORMAL: "teal", ATTENTION: "orange", URGENT: "red" }[session.urgency]}>
                    {{ NORMAL: "Normal", ATTENTION: "Attention", URGENT: "Urgent" }[session.urgency]}
                  </Badge>
                </div>
                {session.counselorNote && (
                  <div style={{ background: "#e3f7f8", border: "1px solid #7dd4d7", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#054548" }}>
                    {t('patientProfile.noteForCounselors')} {session.counselorNote}
                  </div>
                )}
                {(user.role === "manager" || user.role === "therapist") && session.notes && (
                  <div style={{ background: "#f0e8fb", border: `1px solid #c9a8f0`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#3d1a6b", marginTop: 6 }}>
                    🔒 {session.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* NOTES TAB */}
      {tab === "notes" && (
        <div>
          <Card style={{ marginBottom: 12 }}>
            <CT icon="📋" bg="#e8f0fb">{t('patientProfile.patientDetailsTitle')}</CT>
            {[
              [t('patientProfile.fullNameLabel'), p.name],
              [t('patientProfile.dateOfBirthLabel'), p.dob || "—"],
              [t('patientProfile.admissionDateLabel'), p.admitDate || "—"],
              [t('patientProfile.roomLabel'), room ? `${room.number} – ${room.building}` : "—"],
              [t('patientProfile.daysLabel'), p.daysInRehab ?? "—"],
            ].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                <span style={{ color: C.soft }}>{l}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            {p.notes && (
              <div style={{ marginTop: 10, background: "#f7f9fc", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: C.mid }}>
                <div style={{ fontWeight: 700, fontSize: 11, color: C.soft, marginBottom: 4 }}>{t('patientProfile.notesLabel')}</div>
                {p.notes}
              </div>
            )}
          </Card>
        </div>
      )}
    </Modal>
  );
}
