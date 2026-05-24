import { C } from "../data/constants";
import { Card, CT, Alrt } from "../components/ui";

export default function TherapistTab({
  users,
  patients,
  therapistAssignments,
  onAssignTherapist,
  t = (k) => k,
  dir = "ltr",
}) {
  const therapists = users.filter((u) => u.role === "therapist");
  return (
    <Card>
      {" "}
      <CT icon="🧠" bg="#fef3e8">
        {t('manage.therapistTabTitle')}
      </CT>{" "}
      <Alrt type="teal" icon="💡">
        {t('manage.therapistTabInfo')}
      </Alrt>{" "}
      {patients.map((p) => {
        const assigned = therapistAssignments[p.id];
        const therapist = users.find((u) => u.id === assigned);
        return (
          <div
            key={p.id}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 0",
              borderBottom: `1px solid ${C.border}`,
              gap: 10,
            }}
          >
            {" "}
            <div style={{ flex: 1 }}>
              {" "}
              <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{p.name}</div>{" "}
              <div style={{ fontSize: 11, color: therapist ? C.teal : C.soft }}>
                {therapist ? `🧠 ${therapist.name}` : t('manage.therapistNotAssigned')}
              </div>{" "}
            </div>{" "}
            <select
              value={assigned || ""}
              onChange={(e) => onAssignTherapist(p.id, e.target.value || null)}
              dir={dir}
              style={{
                padding: "5px 10px",
                borderRadius: 8,
                border: `1.5px solid ${C.border}`,
                fontSize: 12,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              {" "}
              <option value="">{t('manage.selectTherapistPlaceholder')}</option>{" "}
              {therapists.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}{" "}
            </select>{" "}
          </div>
        );
      })}{" "}
    </Card>
  );
}
