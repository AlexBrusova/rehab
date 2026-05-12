import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";

const router = Router();
router.use(authMiddleware);

const toFrontend = (g: any) => ({
  ...g,
  attendance: g.attendance?.map((a: any) => ({
    id: `${a.groupId}_${a.patientId}`,
    sessionId: a.groupId,
    patientId: a.patientId,
    status: a.status,
  })),
});

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { houseId, date } = req.query;
    const groups = await prisma.group.findMany({
      where: {
        ...(houseId ? { houseId: String(houseId) } : {}),
        ...(date ? { date: String(date) } : {}),
      },
      include: { attendance: true },
      orderBy: { createdAt: "asc" },
    });
    res.json(groups.map(toFrontend));
  } catch (e) {
    console.error("Get groups error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { houseId, topic, type, time, date, status } = req.body;
    const group = await prisma.group.create({
      data: {
        houseId,
        topic,
        type: type || "therapeutic",
        time: time || "",
        date: date || new Date().toLocaleDateString("en-GB"),
        status: status || "active",
      },
      include: { attendance: true },
    });
    res.status(201).json(toFrontend(group));
  } catch (e) {
    console.error("Create group error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { status, notes } = req.body;
    const data: any = {};
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;
    const group = await prisma.group.update({
      where: { id: String(req.params.id) },
      data,
      include: { attendance: true },
    });
    res.json(toFrontend(group));
  } catch (e) {
    console.error("Update group error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id/attendance", async (req: AuthRequest, res: Response) => {
  try {
    const groupId = String(req.params.id);
    const { patientId, status } = req.body;
    await prisma.groupAttendance.upsert({
      where: { groupId_patientId: { groupId, patientId } },
      update: { status },
      create: { groupId, patientId, status },
    });
    res.json({ id: `${groupId}_${patientId}`, sessionId: groupId, patientId, status });
  } catch (e) {
    console.error("Upsert attendance error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
