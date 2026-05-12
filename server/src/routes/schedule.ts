import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";

const router = Router();
router.use(authMiddleware);

const toFrontend = (s: any) => ({ ...s, shift: s.shiftType || "24h" });

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { houseId } = req.query;
    const rows = await prisma.schedule.findMany({
      where: { houseId: String(houseId) },
      orderBy: { date: "asc" },
    });
    res.json(rows.map(toFrontend));
  } catch (e) {
    console.error("Get schedule error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/schedule/assign — delete existing for date, create new if counselorId given
router.put("/assign", async (req: AuthRequest, res: Response) => {
  try {
    const { houseId, date, counselorId, note } = req.body;
    await prisma.schedule.deleteMany({ where: { houseId, date } });
    if (counselorId) {
      const created = await prisma.schedule.create({
        data: { houseId, counselorId, date, shiftType: "24h", note: note || "" },
      });
      return res.json(toFrontend(created));
    }
    res.json(null);
  } catch (e) {
    console.error("Assign schedule error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
