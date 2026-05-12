import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { houseId } = req.query;
    const summaries = await prisma.dailySummary.findMany({
      where: houseId ? { houseId: String(houseId) } : {},
      orderBy: { createdAt: "desc" },
    });
    res.json(summaries);
  } catch (e) {
    console.error("Get summaries error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { houseId, counselorId, generalText, patientSummaries } = req.body;
    const summary = await prisma.dailySummary.create({
      data: {
        houseId,
        counselorId,
        date: new Date().toLocaleDateString("en-GB"),
        generalText: generalText || "",
        patientSummaries: patientSummaries || {},
        notifiedAt: new Date().toTimeString().slice(0, 5),
      },
    });
    res.status(201).json(summary);
  } catch (e) {
    console.error("Create summary error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
