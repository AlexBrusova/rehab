import { useState } from "react";
import { C, pName } from "../data/constants";
import { Badge, Card, CT, Alrt, Btn, Th, Td, Modal, FL, FI, FS, FTA } from "../components/ui";

export default function Finance({
  patients,
  finance,
  cashbox,
  cashboxCounts,
  user,
  toast,
  activeHouseId,
  onAddPatientTx,
  onAddCashTx,
  onAddCashboxCount,
}) {
  const [tab, setTab] = useState("patients");
  const isManager = user.role === "manager"; /* ── PATIENTS TAB ── */
  const [selPat, setSelPat] = useState("");
  const effectiveSelPat = selPat || patients[0]?.id || "";
  const [showAdd, setShowAdd] = useState(null);
  const [newTx, setNewTx] = useState({
    type: "deposit",
    amount: "",
    cat: "Family",
    note: "",
  });
  const pFin = finance
    .filter((f) => f.patientId === effectiveSelPat)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const balance = pFin.length > 0 ? pFin[0].balance : 0;
  const totalIn = pFin
    .filter((f) => f.type === "deposit")
    .reduce((a, f) => a + f.amount, 0);
  const totalOut = pFin
    .filter((f) => f.type === "withdrawal")
    .reduce((a, f) => a + f.amount, 0);
  const addPatientTx = async () => {
    if (!effectiveSelPat) { toast("⚠️ Please select a patient"); return; }
    if (!newTx.amount || isNaN(newTx.amount)) {
      toast("⚠️ Please enter a valid Amount");
      return;
    }
    const amt = Number(newTx.amount);
    try {
      await onAddPatientTx(effectiveSelPat, newTx.type, amt, newTx.cat, newTx.note, balance);
      setNewTx({ type: "deposit", amount: "", cat: "Family", note: "" });
      setShowAdd(null);
      toast(`✅ ${newTx.type === "deposit" ? "Deposit" : "Withdrawal"} recorded`);
    } catch { toast("❌ Failed to record transaction"); }
  }; /* ── CASHBOX TAB ── */
  const [showCashTx, setShowCashTx] = useState(null);
  const [showCount, setShowCount] = useState(false);
  const [newCashTx, setNewCashTx] = useState({
    type: "deposit",
    amount: "",
    cat: "Misc. Income",
    note: "",
  });
  const [countAmount, setCountAmount] = useState("");
  const [countNotes, setCountNotes] = useState("");
  const houseCashbox = cashbox;
  const houseCounts = cashboxCounts;
  const cbBalance = houseCashbox.length > 0 ? houseCashbox[0].balance : 0;
  const cbIn = houseCashbox
    .filter((f) => f.type === "deposit")
    .reduce((a, f) => a + f.amount, 0);
  const cbOut = houseCashbox
    .filter((f) => f.type === "withdrawal")
    .reduce((a, f) => a + f.amount, 0);
  const addCashTx = async () => {
    if (!newCashTx.amount || isNaN(newCashTx.amount)) {
      toast("⚠️ Please enter a valid Amount");
      return;
    }
    const amt = Number(newCashTx.amount);
    try {
      await onAddCashTx(activeHouseId, newCashTx.type, amt, newCashTx.cat, newCashTx.note, cbBalance);
      setNewCashTx({ type: "deposit", amount: "", cat: "Misc. Income", note: "" });
      setShowCashTx(null);
      toast(`✅ ${newCashTx.type === "deposit" ? "Income" : "Withdrawal"} to Cashbox recorded`);
    } catch { toast("❌ Failed to record cashbox transaction"); }
  };
  const submitCount = async () => {
    if (!countAmount || isNaN(countAmount)) {
      toast("⚠️ Please enter the amount you counted");
      return;
    }
    const counted = Number(countAmount);
    const diff = counted - cbBalance;
    try {
      await onAddCashboxCount(activeHouseId, counted, cbBalance, diff, countNotes);
      setShowCount(false);
      setCountAmount("");
      setCountNotes("");
      toast(
        diff === 0
          ? "✅ Cashbox count OK – all balanced"
          : diff > 0
            ? `⚠️ Surplus of ₪${diff}`
            : `⚠️ Missing ₪${Math.abs(diff)}`,
      );
    } catch { toast("❌ Failed to save cashbox count"); }
  };
  return (
    <div>
      {" "}
      {/* ADD MODALS */}{" "}
      {showAdd && (
        <Modal
          onClose={() => setShowAdd(null)}
          title={
            showAdd === "deposit"
              ? "💰 Deposit to Patient"
              : "💸 Withdrawal from Patient"
          }
          width={380}
        >
          {" "}
          <FL label="Amount (₪)">
            <FI
              value={newTx.amount}
              onChange={(v) => setNewTx((t) => ({ ...t, amount: v }))}
              placeholder="500"
              type="number"
            />
          </FL>{" "}
          <FL label="Category">
            <FS
              value={newTx.cat}
              onChange={(v) => setNewTx((t) => ({ ...t, cat: v }))}
              options={
                showAdd === "deposit"
                  ? ["Family", "Opening", "Other"]
                  : ["Hygiene", "Shopping", "Medications", "Other"]
              }
            />
          </FL>{" "}
          <FL label="Note">
            <FI
              value={newTx.note}
              onChange={(v) => setNewTx((t) => ({ ...t, note: v }))}
              placeholder="Short description"
            />
          </FL>{" "}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Btn
              color={showAdd === "deposit" ? "teal" : "red"}
              onClick={addPatientTx}
            >
              ✓ Save
            </Btn>
            <Btn color="outline" onClick={() => setShowAdd(null)}>
              Cancel
            </Btn>
          </div>{" "}
        </Modal>
      )}{" "}
      {showCashTx && (
        <Modal
          onClose={() => setShowCashTx(null)}
          title={
            showCashTx === "deposit"
              ? "🏦 Deposit to Cashbox"
              : "💸 Withdrawal from Cashbox"
          }
          width={380}
        >
          {" "}
          <FL label="Amount (₪)">
            <FI
              value={newCashTx.amount}
              onChange={(v) => setNewCashTx((t) => ({ ...t, amount: v }))}
              placeholder="500"
              type="number"
            />
          </FL>{" "}
          <FL label="Category">
            <FS
              value={newCashTx.cat}
              onChange={(v) => setNewCashTx((t) => ({ ...t, cat: v }))}
              options={
                showCashTx === "deposit"
                  ? ["Misc. Income", "Donation", "Family payment", "Other"]
                  : ["Equipment", "Food", "Maintenance", "Salary", "Other"]
              }
            />
          </FL>{" "}
          <FL label="Note">
            <FI
              value={newCashTx.note}
              onChange={(v) => setNewCashTx((t) => ({ ...t, note: v }))}
              placeholder="Short description"
            />
          </FL>{" "}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Btn
              color={showCashTx === "deposit" ? "teal" : "red"}
              onClick={addCashTx}
            >
              ✓ Save
            </Btn>
            <Btn color="outline" onClick={() => setShowCashTx(null)}>
              Cancel
            </Btn>
          </div>{" "}
        </Modal>
      )}{" "}
      {showCount && (
        <Modal
          onClose={() => setShowCount(false)}
          title="🔢 Cashbox Count – Shift Handoff"
          width={400}
        >
          {" "}
          <div
            style={{
              background: "#e3f7f8",
              border: "1px solid #7dd4d7",
              borderRadius: 10,
              padding: 14,
              marginBottom: 16,
            }}
          >
            {" "}
            <div style={{ fontSize: 12, color: C.mid, marginBottom: 4 }}>
              System Expected Balance:
            </div>{" "}
            <div style={{ fontSize: 24, fontWeight: 900, color: C.teal }}>
              ₪{cbBalance.toLocaleString()}
            </div>{" "}
          </div>{" "}
          <FL label="Actual amount counted (₪) ⭐">
            <FI
              value={countAmount}
              onChange={setCountAmount}
              placeholder="Enter the amount you counted"
              type="number"
            />
          </FL>{" "}
          {countAmount &&
            !isNaN(countAmount) &&
            (() => {
              const diff = Number(countAmount) - cbBalance;
              if (diff !== 0)
                return (
                  <div
                    style={{
                      background: Math.abs(diff) < 50 ? "#fff5e8" : "#fce8e8",
                      border: `1px solid ${Math.abs(diff) < 50 ? "#f5c07a" : "#f0a8a8"}`,
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 13,
                      fontWeight: 700,
                      color: diff > 0 ? C.green : C.red,
                      marginBottom: 12,
                    }}
                  >
                    {diff > 0
                      ? `✅ Surplus: +₪${diff}`
                      : `⚠️ Deficit: -₪${Math.abs(diff)}`}
                  </div>
                );
              return (
                <div
                  style={{
                    background: "#e8f8ef",
                    border: "1px solid #b8e8cb",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: C.green,
                    marginBottom: 12,
                  }}
                >
                  ✅ Amount matches!
                </div>
              );
            })()}{" "}
          <FL label="Notes">
            <FTA
              value={countNotes}
              onChange={setCountNotes}
              placeholder="Notes for count..."
              rows={2}
            />
          </FL>{" "}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Btn color="teal" onClick={submitCount}>
              ✓ Sign the Count
            </Btn>
            <Btn color="outline" onClick={() => setShowCount(false)}>
              Cancel
            </Btn>
          </div>{" "}
        </Modal>
      )}{" "}
      {/* TABS */}{" "}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "#f0f2f5",
          borderRadius: 10,
          padding: 4,
          marginBottom: 18,
          width: "fit-content",
        }}
      >
        {" "}
        {[
          ["patients", "👤 Patient Funds"],
          ["cashbox", "🏦 Center Cashbox"],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            style={{
              padding: "7px 18px",
              borderRadius: 8,
              border: "none",
              fontSize: 13,
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
      {/* ── PATIENTS TAB ── */}{" "}
      {tab === "patients" && (
        <div>
          {" "}
          {!isManager && (
            <Alrt type="teal" icon="💡">
              Patient funds – view and management for the shift
            </Alrt>
          )}{" "}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 18,
              alignItems: "flex-end",
            }}
          >
            {" "}
            <div style={{ flex: 1, maxWidth: 220 }}>
              {" "}
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.soft,
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Select Patient
              </label>{" "}
              <FS
                value={effectiveSelPat}
                onChange={setSelPat}
                options={patients.map((p) => ({ v: p.id, l: p.name }))}
              />{" "}
            </div>{" "}
            <Btn
              color="teal"
              size="sm"
              onClick={() => {
                setNewTx((t) => ({ ...t, type: "deposit" }));
                setShowAdd("deposit");
              }}
            >
              + Deposit
            </Btn>{" "}
            <Btn
              color="red"
              size="sm"
              onClick={() => {
                setNewTx((t) => ({ ...t, type: "withdrawal" }));
                setShowAdd("withdrawal");
              }}
            >
              + Withdrawal
            </Btn>{" "}
          </div>{" "}
          <Card>
            {" "}
            <CT icon="💰" bg="#e8f0fb">
              Account – {pName(patients, effectiveSelPat)}
            </CT>{" "}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 12,
                marginBottom: 20,
              }}
            >
              {" "}
              {[
                [
                  "Total Deposits",
                  `₪${totalIn.toLocaleString()}`,
                  C.green,
                  "#e8f8ef",
                  "#b8e8cb",
                ],
                [
                  "Total Expenses",
                  `₪${totalOut.toLocaleString()}`,
                  C.red,
                  "#fce8e8",
                  "#f0b8b8",
                ],
                [
                  "Balance",
                  `₪${balance.toLocaleString()}`,
                  C.blue,
                  "#e8f0fb",
                  "#b8ccf0",
                ],
              ].map(([l, v, c, bg, br]) => (
                <div
                  key={l}
                  style={{
                    background: bg,
                    border: `1px solid ${br}`,
                    borderRadius: 10,
                    padding: 14,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: C.soft,
                      marginBottom: 4,
                    }}
                  >
                    {l}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: c }}>
                    {v}
                  </div>
                </div>
              ))}{" "}
            </div>{" "}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Type</Th>
                  <Th>Amount</Th>
                  <Th>Category</Th>
                  <Th>Note</Th>
                  <Th>Balance</Th>
                </tr>
              </thead>
              <tbody>
                {" "}
                {pFin.map((f) => (
                  <tr key={f.id}>
                    {" "}
                    <Td style={{ fontSize: 12, color: C.soft }}>
                      {f.date}
                    </Td>{" "}
                    <Td
                      style={{
                        fontWeight: 700,
                        color: f.type === "deposit" ? C.green : C.red,
                      }}
                    >
                      {f.type === "deposit" ? "↑ Deposit" : "↓ Withdrawal"}
                    </Td>{" "}
                    <Td
                      style={{
                        fontWeight: 700,
                        color: f.type === "deposit" ? C.green : C.red,
                      }}
                    >
                      {f.type === "deposit" ? "+" : "-"}₪{f.amount}
                    </Td>{" "}
                    <Td>
                      <Badge type={f.type === "deposit" ? "green" : "orange"}>
                        {f.cat}
                      </Badge>
                    </Td>{" "}
                    <Td style={{ fontSize: 12, color: C.soft }}>{f.note}</Td>{" "}
                    <Td style={{ fontWeight: 700 }}>
                      ₪{f.balance.toLocaleString()}
                    </Td>{" "}
                  </tr>
                ))}{" "}
              </tbody>
            </table>
          </Card>{" "}
        </div>
      )}{" "}
      {/* ── CASHBOX TAB ── */}{" "}
      {tab === "cashbox" && (
        <div>
          {" "}
          {/* Summary */}{" "}
          <div
            style={{
              background: `linear-gradient(135deg,${C.navy},${C.navyMid})`,
              borderRadius: 14,
              padding: 24,
              color: "#fff",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 24,
            }}
          >
            {" "}
            <div>
              {" "}
              <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>
                Center Cashbox Balance
              </div>{" "}
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  color: "#5dffd5",
                  lineHeight: 1,
                }}
              >
                ₪{cbBalance.toLocaleString()}
              </div>{" "}
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                last updated: {houseCashbox[0]?.date} {houseCashbox[0]?.time}
              </div>{" "}
            </div>{" "}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginRight: "auto",
              }}
            >
              {" "}
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                ↑ Income: <strong>₪{cbIn.toLocaleString()}</strong>
              </div>{" "}
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                ↓ Withdrawn: <strong>₪{cbOut.toLocaleString()}</strong>
              </div>{" "}
            </div>{" "}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {" "}
              <Btn
                color="teal"
                size="sm"
                onClick={() => {
                  setNewCashTx((t) => ({ ...t, type: "deposit" }));
                  setShowCashTx("deposit");
                }}
              >
                + Income
              </Btn>{" "}
              <Btn
                color="red"
                size="sm"
                onClick={() => {
                  setNewCashTx((t) => ({ ...t, type: "withdrawal" }));
                  setShowCashTx("withdrawal");
                }}
              >
                + Withdrawal
              </Btn>{" "}
              <Btn color="orange" size="sm" onClick={() => setShowCount(true)}>
                🔢 Counted Cashbox
              </Btn>{" "}
            </div>{" "}
          </div>{" "}
          <div
            style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}
          >
            {" "}
            {/* Transactions */}{" "}
            <Card>
              {" "}
              <CT icon="📋" bg="#e8f0fb">
                Cashbox Transactions
              </CT>{" "}
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Time</Th>
                    <Th>Type</Th>
                    <Th>Amount</Th>
                    <Th>Category</Th>
                    <Th>recorded by</Th>
                    <Th>Balance</Th>
                  </tr>
                </thead>
                <tbody>
                  {" "}
                  {houseCashbox.map((f) => (
                    <tr key={f.id}>
                      {" "}
                      <Td style={{ fontSize: 12, color: C.soft }}>
                        {f.date}
                      </Td>{" "}
                      <Td style={{ fontSize: 12, color: C.soft }}>{f.time}</Td>{" "}
                      <Td
                        style={{
                          fontWeight: 700,
                          color: f.type === "deposit" ? C.green : C.red,
                        }}
                      >
                        {f.type === "deposit" ? "↑ Income" : "↓ Withdrawal"}
                      </Td>{" "}
                      <Td
                        style={{
                          fontWeight: 700,
                          color: f.type === "deposit" ? C.green : C.red,
                        }}
                      >
                        {f.type === "deposit" ? "+" : "-"}₪{f.amount}
                      </Td>{" "}
                      <Td>
                        <Badge type={f.type === "deposit" ? "green" : "orange"}>
                          {f.cat}
                        </Badge>
                      </Td>{" "}
                      <Td style={{ fontSize: 12 }}>{f.by}</Td>{" "}
                      <Td style={{ fontWeight: 700 }}>
                        ₪{f.balance.toLocaleString()}
                      </Td>{" "}
                    </tr>
                  ))}{" "}
                </tbody>
              </table>
            </Card>{" "}
            {/* Cash counts history */}{" "}
            <Card>
              {" "}
              <CT icon="🔢" bg="#fef3e8">
                counts Cashbox
              </CT>{" "}
              {houseCounts.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: 16,
                    color: C.soft,
                    fontSize: 13,
                  }}
                >
                  No counts yet
                </div>
              )}{" "}
              {houseCounts.map((cc) => {
                const hasDiff = cc.diff && cc.diff !== 0;
                return (
                  <div
                    key={cc.id}
                    style={{
                      borderRadius: 10,
                      border: `1.5px solid ${hasDiff ? C.orange : C.green}`,
                      background: hasDiff ? "#fff8f2" : "#f0faf5",
                      padding: 14,
                      marginBottom: 10,
                    }}
                  >
                    {" "}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 6,
                      }}
                    >
                      {" "}
                      <div>
                        {" "}
                        <div style={{ fontWeight: 700, fontSize: 13 }}>
                          {cc.date} {cc.time}
                        </div>{" "}
                        <div style={{ fontSize: 12, color: C.soft }}>
                          Counted by: {cc.countedBy}
                        </div>{" "}
                      </div>{" "}
                      <Badge type={hasDiff ? "orange" : "green"}>
                        {hasDiff ? `Diff: ₪${cc.diff}` : "OK ✓"}
                      </Badge>{" "}
                    </div>{" "}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                        fontSize: 12,
                      }}
                    >
                      {" "}
                      <div
                        style={{
                          background: "#f7f9fc",
                          borderRadius: 7,
                          padding: "7px 10px",
                        }}
                      >
                        <div style={{ color: C.soft, marginBottom: 2 }}>
                          Expected
                        </div>
                        <div style={{ fontWeight: 700 }}>
                          ₪{cc.expected?.toLocaleString() || "—"}
                        </div>
                      </div>{" "}
                      <div
                        style={{
                          background: "#f7f9fc",
                          borderRadius: 7,
                          padding: "7px 10px",
                        }}
                      >
                        <div style={{ color: C.soft, marginBottom: 2 }}>
                          Counted
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            color: hasDiff ? C.orange : C.green,
                          }}
                        >
                          ₪{cc.amount.toLocaleString()}
                        </div>
                      </div>{" "}
                    </div>{" "}
                    {cc.notes && (
                      <div
                        style={{
                          fontSize: 12,
                          color: C.mid,
                          marginTop: 6,
                          fontStyle: "italic",
                        }}
                      >
                        {cc.notes}
                      </div>
                    )}{" "}
                  </div>
                );
              })}{" "}
            </Card>{" "}
          </div>{" "}
        </div>
      )}{" "}
    </div>
  );
}
