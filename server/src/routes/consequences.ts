import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { houseId } = req.query;
    const consequences = await prisma.consequence.findMany({
      where: houseId ? { houseId: String(houseId) } : {},
      orderBy: { createdAt: "desc" },
    });
    res.json(consequences);
  } catch (e) {
    console.error("Get consequences error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { patientId, houseId, type, description, date } = req.body;
    const consequence = await prisma.consequence.create({
      data: { patientId, houseId, type, description, date },
    });
    res.status(201).json(consequence);
  } catch (e) {
    console.error("Create consequence error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { status, approvedBy } = req.body;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (status !== undefined) data.status = status;
    if (approvedBy !== undefined) data.approvedBy = approvedBy;
    const consequence = await prisma.consequence.update({
      where: { id: String(req.params.id) },
      data,
    });
    res.json(consequence);
  } catch (e) {
    console.error("Update consequence error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
