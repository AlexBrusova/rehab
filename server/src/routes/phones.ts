import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { houseId } = req.query;
    const phones = await prisma.phone.findMany({
      where: houseId ? { patient: { houseId: String(houseId) } } : {},
      orderBy: { createdAt: "desc" },
    });
    res.json(phones);
  } catch (e) {
    console.error("Get phones error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { patientId, givenAt, returnBy } = req.body;
    const phone = await prisma.phone.create({
      data: { patientId, givenAt, returnBy },
    });
    res.status(201).json(phone);
  } catch (e) {
    console.error("Create phone error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { status, returnedAt, late } = req.body;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (status !== undefined) data.status = status;
    if (returnedAt !== undefined) data.returnedAt = returnedAt;
    if (late !== undefined) data.late = late;
    const phone = await prisma.phone.update({
      where: { id: String(req.params.id) },
      data,
    });
    res.json(phone);
  } catch (e) {
    console.error("Update phone error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
