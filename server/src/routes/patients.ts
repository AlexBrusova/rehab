import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";

const router = Router();
router.use(authMiddleware);

router.get("/archived", async (req: AuthRequest, res: Response) => {
  try {
    const { houseId } = req.query;
    const patients = await prisma.$queryRaw<any[]>`
      SELECT * FROM "Patient"
      WHERE "houseId" = ${String(houseId)}
      AND status::text = 'archived'
      ORDER BY name ASC
    `;
    res.json(patients);
  } catch (e) {
    console.error("Get archived patients error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { houseId } = req.query;
    const patients = await prisma.patient.findMany({
      where: {
        status: "active",
        ...(houseId ? { houseId: String(houseId) } : {}),
      },
      include: { room: true, meds: true },
      orderBy: { name: "asc" },
    });
    res.json(patients);
  } catch (e) {
    console.error("Get patients error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { name, dob, admitDate, houseId, roomId } = req.body;
    const patient = await prisma.patient.create({
      data: { name, dob: dob || "", admitDate: admitDate || "", houseId, roomId: roomId || null },
    });
    res.status(201).json(patient);
  } catch (e) {
    console.error("Create patient error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const allowed = ["name","dob","admitDate","roomId","mood","alert","status","dischargeType","dischargeDate","daysInRehab"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    const patient = await prisma.patient.update({
      where: { id: String(req.params.id) },
      data,
    });
    res.json(patient);
  } catch (e) {
    console.error("Update patient error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    await prisma.patient.update({
      where: { id: String(req.params.id) },
      data: { status: "archived" },
    });
    res.json({ ok: true });
  } catch (e) {
    console.error("Archive patient error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
