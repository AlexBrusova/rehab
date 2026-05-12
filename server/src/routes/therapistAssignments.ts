import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { houseId } = req.query;
    const rows = await prisma.therapistAssignment.findMany({
      where: { patient: { houseId: String(houseId) } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.patientId, r.therapistId]));
    res.json(map);
  } catch (e) {
    console.error("Get therapist assignments error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/", async (req: AuthRequest, res: Response) => {
  try {
    const { patientId, therapistId } = req.body;
    if (!therapistId) {
      await prisma.therapistAssignment.deleteMany({ where: { patientId } });
    } else {
      await prisma.therapistAssignment.upsert({
        where: { patientId },
        create: { patientId, therapistId },
        update: { therapistId },
      });
    }
    res.json({ patientId, therapistId: therapistId || null });
  } catch (e) {
    console.error("Assign therapist error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
