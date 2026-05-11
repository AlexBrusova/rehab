import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { houseId } = req.query;
    const rooms = await prisma.room.findMany({
      where: houseId ? { houseId: String(houseId) } : {},
      orderBy: [{ building: "asc" }, { number: "asc" }],
    });
    res.json(rooms);
  } catch (e) {
    console.error("Get rooms error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { number, building, capacity, houseId } = req.body;
    const room = await prisma.room.create({
      data: { number, building, capacity: Number(capacity) || 1, houseId },
    });
    res.status(201).json(room);
  } catch (e) {
    console.error("Create room error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { number, building, capacity } = req.body;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (number !== undefined) data.number = number;
    if (building !== undefined) data.building = building;
    if (capacity !== undefined) data.capacity = Number(capacity);
    const room = await prisma.room.update({
      where: { id: String(req.params.id) },
      data,
    });
    res.json(room);
  } catch (e) {
    console.error("Update room error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    await prisma.room.delete({ where: { id: String(req.params.id) } });
    res.json({ ok: true });
  } catch (e) {
    console.error("Delete room error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
