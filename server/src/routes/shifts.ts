import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { houseId, date } = req.query;
    const shifts = await prisma.shift.findMany({
      where: {
        ...(houseId ? { houseId: String(houseId) } : {}),
        ...(date ? { date: String(date) } : {}),
      },
      include: { counselor: { select: { id: true, name: true, initials: true, color: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(shifts);
  } catch (e) {
    console.error("Get shifts error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { houseId, counselorId, date, shift, note, receivedFrom, start } = req.body;
    const created = await prisma.shift.create({
      data: {
        houseId, counselorId, date,
        shift: shift || "24h",
        status: "ACTIVE",
        note: note || null,
        receivedFrom: receivedFrom || null,
        start: start || null,
      },
      include: { counselor: { select: { id: true, name: true, initials: true, color: true } } },
    });
    res.status(201).json(created);
  } catch (e) {
    console.error("Create shift error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const allowed = ["status", "note", "receivedFrom", "handedTo", "accepted", "start", "end"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    const updated = await prisma.shift.update({
      where: { id: String(req.params.id) },
      data,
      include: { counselor: { select: { id: true, name: true, initials: true, color: true } } },
    });
    res.json(updated);
  } catch (e) {
    console.error("Update shift error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
