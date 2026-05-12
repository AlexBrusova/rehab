import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";

const router = Router();
router.use(authMiddleware);

const toTimes = (m: any): string[] => {
  const t: string[] = [];
  if (m.morning) t.push("morning");
  if (m.noon) t.push("noon");
  if (m.evening) t.push("evening");
  if (m.night) t.push("night");
  return t;
};

export const toFrontend = (m: any) => ({
  ...m,
  morning: (m.times || []).includes("morning"),
  noon: (m.times || []).includes("noon"),
  evening: (m.times || []).includes("evening"),
  night: (m.times || []).includes("night"),
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { patientId, name, dose, unit, morning, noon, evening, night } = req.body;
    const med = await prisma.med.create({
      data: { patientId, name, dose, unit: unit || "mg", times: toTimes({ morning, noon, evening, night }) },
    });
    res.status(201).json(toFrontend(med));
  } catch (e) {
    console.error("Create med error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { name, dose, unit, morning, noon, evening, night } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (dose !== undefined) data.dose = dose;
    if (unit !== undefined) data.unit = unit;
    if ([morning, noon, evening, night].some((v) => v !== undefined)) {
      const existing = await prisma.med.findUnique({ where: { id: String(req.params.id) } });
      const cur = {
        morning: (existing?.times || []).includes("morning"),
        noon: (existing?.times || []).includes("noon"),
        evening: (existing?.times || []).includes("evening"),
        night: (existing?.times || []).includes("night"),
      };
      data.times = toTimes({
        morning: morning !== undefined ? morning : cur.morning,
        noon: noon !== undefined ? noon : cur.noon,
        evening: evening !== undefined ? evening : cur.evening,
        night: night !== undefined ? night : cur.night,
      });
    }
    const med = await prisma.med.update({ where: { id: String(req.params.id) }, data });
    res.json(toFrontend(med));
  } catch (e) {
    console.error("Update med error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    await prisma.med.delete({ where: { id: String(req.params.id) } });
    res.json({ ok: true });
  } catch (e) {
    console.error("Delete med error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
