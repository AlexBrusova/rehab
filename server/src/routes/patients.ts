import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
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
});

router.post("/", async (req: AuthRequest, res: Response) => {
  const patient = await prisma.patient.create({ data: req.body });
  res.status(201).json(patient);
});

router.patch("/:id", async (req: AuthRequest, res: Response) => {
  const patient = await prisma.patient.update({
    where: { id: String(req.params.id) },
    data: req.body,
  });
  res.json(patient);
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  await prisma.patient.update({
    where: { id: String(req.params.id) },
    data: { status: "archived" },
  });
  res.json({ ok: true });
});

export default router;
