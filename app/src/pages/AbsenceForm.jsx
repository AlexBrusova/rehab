import { useState } from "react";
import { C } from "../data/constants";
import { V } from "../data/validationLimits";
import {
  isValidDateDdMmYyyy,
  sanitizeDateDdMm,
} from "../lib/inputSanitize";
import { Btn, FL, FI, FS } from "../components/ui";
import useBreakpoint from "../hooks/useBreakpoint";

export default function AbsenceForm({ patients, onMarkAway, toast, t = (k) => k, dir = "ltr" }) {
  const { isMobile } = useBreakpoint();
  const [selPat, setSelPat] = useState("");
  const [type, setType] = useState("Home Visit");
  const [returnDate, setReturnDate] = useState("");
  const submit = async () => {
    if (!selPat || !returnDate) {
      toast(t('absences.toastSelectPatientDate'));
      return;
    }
    if (!isValidDateDdMmYyyy(returnDate)) {
      toast(t('absences.toastInvalidReturnDate'));
      return;
    }
    try {
      const name = patients.find((p) => p.id === selPat)?.name;
      await onMarkAway(selPat, type);
      setSelPat("");
      setReturnDate("");
      toast(`✅ ${name} left for ${type} – Expected return ${returnDate}`);
    } catch { toast(t('absences.toastRecordFailed')); }
  };
  return (
    <div>
      {" "}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr",
          gap: 12,
          marginBottom: 12,
        }}
      >
        {" "}
        <FL label={t('absences.patientLabel')}>
          {" "}
          <FS
            dir={dir}
            value={selPat}
            onChange={setSelPat}
            options={[
              { v: "", l: t('absences.selectPatientPlaceholder') },
              ...patients.map((p) => ({ v: p.id, l: p.name })),
            ]}
          />{" "}
        </FL>{" "}
        <FL label={t('patientProfile.dateReturnLabel')}>
          {" "}
          <FI
            dir={dir}
            value={returnDate}
            onChange={setReturnDate}
            placeholder={t('patientProfile.dateReturnPlaceholder')}
            sanitize={sanitizeDateDdMm}
            maxLength={V.DATE_UI_MAX}
            inputMode="numeric"
            title="DD/MM/YYYY"
          />{" "}
        </FL>{" "}
      </div>{" "}
      <FL label={t('patientProfile.typeLogoutLabel')}>
        {" "}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {" "}
          {[
            { key: "Home Visit", label: t('patientProfile.homeVisit') },
            { key: "Errands", label: t('patientProfile.errands') },
            { key: "Therapy Medical", label: t('patientProfile.therapyMedical') },
            { key: "Other", label: t('patientProfile.other') },
          ].map(({ key, label }) => (
            <div
              key={key}
              onClick={() => setType(key)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: `2px solid ${type === key ? C.teal : C.border}`,
                background: type === key ? C.teal : "#fff",
                color: type === key ? "#fff" : C.mid,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {label}
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
        {t('patientProfile.absenceWarning')}{" "}
      </div>{" "}
      <Btn color="teal" onClick={submit}>
        {t('absences.approveAbsenceButton')}
      </Btn>{" "}
    </div>
  );
}
