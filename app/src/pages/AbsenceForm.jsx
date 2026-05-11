import { useState } from "react";
import { C } from "../data/constants";
import { Btn, FL, FI, FS } from "../components/ui";

export default function AbsenceForm({ patients, setPatients, toast }) {
  const [selPat, setSelPat] = useState("");
  const [type, setType] = useState("Home Visit");
  const [returnDate, setReturnDate] = useState("");
  const submit = () => {
    if (!selPat || !returnDate) {
      toast("⚠️ Please select Patient and Return Date");
      return;
    }
    setPatients((prev) =>
      prev.map((p) =>
        p.id === selPat ? { ...p, status: "away", awayType: type } : p,
      ),
    );
    const name = patients.find((p) => p.id === selPat)?.name;
    setSelPat("");
    setReturnDate("");
    toast(`✅ ${name} left for ${type} – Expected return ${returnDate}`);
  };
  return (
    <div>
      {" "}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 12,
          marginBottom: 12,
        }}
      >
        {" "}
        <FL label="Patient">
          {" "}
          <FS
            value={selPat}
            onChange={setSelPat}
            options={[
              { v: "", l: "-- Select Patient --" },
              ...patients.map((p) => ({ v: p.id, l: p.name })),
            ]}
          />{" "}
        </FL>{" "}
        <FL label="Date Return Expected">
          {" "}
          <FI
            value={returnDate}
            onChange={setReturnDate}
            placeholder="DD/MM/YYYY"
          />{" "}
        </FL>{" "}
      </div>{" "}
      <FL label="Type Logout">
        {" "}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {" "}
          {["Home Visit", "Errands", "Therapy Medical", "Other"].map((t) => (
            <div
              key={t}
              onClick={() => setType(t)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: `2px solid ${type === t ? C.teal : C.border}`,
                background: type === t ? C.teal : "#fff",
                color: type === t ? "#fff" : C.mid,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t}
            </div>
          ))}{" "}
        </div>{" "}
      </FL>{" "}
      <div
        style={{
          background: "#fff8f0",
          border: "1px solid #f5c07a",
          borderRadius: 8,
          padding: "9px 12px",
          fontSize: 12,
          color: "#8b4800",
          marginBottom: 14,
        }}
      >
        {" "}
        ⚠️ During absence Patient will NOT appear in Medication Distribution,
        Groups and Phones.{" "}
      </div>{" "}
      <Btn color="teal" onClick={submit}>
        ✓ Approve Absence
      </Btn>{" "}
    </div>
  );
} /* Unique colors for Counselors in schedule */
const COUNSELOR_COLORS = [
  "#0d7377",
  "#1e5fa8",
  "#5c2d91",
  "#c55a11",
  "#375623",
  "#c00000",
  "#7b3f00",
  "#006d6d",
];
