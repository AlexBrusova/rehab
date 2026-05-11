import { C } from "../data/constants";
import { Badge, Card, CT, Btn } from "../components/ui";
import AbsenceForm from "./AbsenceForm";

export default function Absences({
  patients,
  setPatients,
  user,
  toast,
}) {
  const isManager = user.role === "manager";
  const away = patients.filter((p) => p.status === "away");
  const confirmReturn = (id) => {
    const name = patients.find((p) => p.id === id)?.name;
    setPatients((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: "active", awayType: null } : p,
      ),
    );
    toast(`✅ ${name} returned to center`);
  };
  return (
    <div>
      {" "}
      {/* Active absences */}{" "}
      <Card style={{ marginBottom: 16 }}>
        {" "}
        <CT icon="🏠" bg="#fef9e7">
          Patients outside center right now
        </CT>{" "}
        {away.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 20,
              color: C.soft,
              fontSize: 13,
            }}
          >
            ✅ No Patients outside center right now
          </div>
        ) : (
          away.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: `1px solid ${C.border}`,
                gap: 12,
              }}
            >
              {" "}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg,${C.orange},#e07b39)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                {" "}
                {p.awayType === "Home Visit"
                  ? "🏠"
                  : p.awayType === "Errands"
                    ? "🛒"
                    : "🚗"}{" "}
              </div>{" "}
              <div style={{ flex: 1 }}>
                {" "}
                <div style={{ fontWeight: 800, fontSize: 14 }}>
                  {p.name}
                </div>{" "}
                <div style={{ fontSize: 12, color: C.soft, marginTop: 2 }}>
                  {" "}
                  <Badge type="yellow">{p.awayType}</Badge>{" "}
                </div>{" "}
              </div>{" "}
              <Btn color="teal" size="sm" onClick={() => confirmReturn(p.id)}>
                {" "}
                ✓ returned to center{" "}
              </Btn>{" "}
            </div>
          ))
        )}{" "}
      </Card>{" "}
      {/* New absence form */}{" "}
      <Card>
        {" "}
        <CT icon="📤" bg="#e8f0fb">
          {" "}
          {isManager ? "Mark New Absence" : "Mark Patient Absence"}{" "}
        </CT>{" "}
        <AbsenceForm
          patients={patients.filter((p) => p.status === "active")}
          setPatients={setPatients}
          toast={toast}
        />{" "}
      </Card>{" "}
    </div>
  );
}
