import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";

const router = Router();
router.use(authMiddleware);

// ── Patient Finance ──────────────────────────────────────────────────────────

router.get("/patient", async (req: AuthRequest, res: Response) => {
  try {
    const { houseId } = req.query;
    const entries = await prisma.finance.findMany({
      where: houseId ? { patient: { houseId: String(houseId) } } : {},
      orderBy: { createdAt: "desc" },
    });
    res.json(entries.map((e) => ({ ...e, cat: e.source })));
  } catch (e) {
    console.error("Get finance error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/patient", async (req: AuthRequest, res: Response) => {
  try {
    const { patientId, type, amount, cat, note, date, balance } = req.body;
    const entry = await prisma.finance.create({
      data: {
        patientId,
        type,
        amount: Number(amount),
        source: cat || "",
        note: note || "",
        date: date || new Date().toLocaleDateString("en-GB"),
        balance: Number(balance),
      },
    });
    res.status(201).json({ ...entry, cat: entry.source });
  } catch (e) {
    console.error("Create finance error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Cashbox ──────────────────────────────────────────────────────────────────

router.get("/cashbox", async (req: AuthRequest, res: Response) => {
  try {
    const { houseId } = req.query;
    const entries = await prisma.cashboxEntry.findMany({
      where: houseId ? { houseId: String(houseId) } : {},
      orderBy: { createdAt: "desc" },
    });
    res.json(entries);
  } catch (e) {
    console.error("Get cashbox error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/cashbox", async (req: AuthRequest, res: Response) => {
  try {
    const { houseId, type, amount, cat, note, date, time, by, balance } = req.body;
    const entry = await prisma.cashboxEntry.create({
      data: {
        houseId,
        type,
        amount: Number(amount),
        cat: cat || "",
        note: note || "",
        date: date || new Date().toLocaleDateString("en-GB"),
        time: time || new Date().toTimeString().slice(0, 5),
        by: by || "",
        balance: Number(balance),
      },
    });
    res.status(201).json(entry);
  } catch (e) {
    console.error("Create cashbox entry error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Cashbox Counts ───────────────────────────────────────────────────────────

router.get("/cashbox-counts", async (req: AuthRequest, res: Response) => {
  try {
    const { houseId } = req.query;
    const counts = await prisma.cashboxCount.findMany({
      where: houseId ? { houseId: String(houseId) } : {},
      orderBy: { createdAt: "desc" },
    });
    res.json(counts);
  } catch (e) {
    console.error("Get cashbox counts error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/cashbox-counts", async (req: AuthRequest, res: Response) => {
  try {
    const { houseId, countedBy, amount, expected, diff, date, time, notes } = req.body;
    const count = await prisma.cashboxCount.create({
      data: {
        houseId,
        countedBy,
        amount: Number(amount),
        expected: Number(expected),
        diff: Number(diff),
        date: date || new Date().toLocaleDateString("en-GB"),
        time: time || new Date().toTimeString().slice(0, 5),
        notes: notes || null,
      },
    });
    res.status(201).json(count);
  } catch (e) {
    console.error("Create cashbox count error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
