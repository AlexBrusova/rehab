import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { houseId } = req.query;
    const sessions = await prisma.therapySession.findMany({
      where: houseId ? { patient: { houseId: String(houseId) } } : {},
      orderBy: { createdAt: "desc" },
    });
    res.json(sessions);
  } catch (e) {
    console.error("Get therapy error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { patientId, therapistId, topic, notes, urgency, counselorNote } = req.body;
    const session = await prisma.therapySession.create({
      data: {
        patientId,
        therapistId,
        date: new Date().toLocaleDateString("en-GB"),
        topic,
        notes: notes || "",
        urgency: urgency || "NORMAL",
        counselorNote: counselorNote || null,
      },
    });
    res.status(201).json(session);
  } catch (e) {
    console.error("Create therapy error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
