import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { houseId, date } = req.query;
    const rows = await prisma.$queryRaw<any[]>`
      SELECT sd.*
      FROM "ShiftDist" sd
      JOIN "Patient" p ON p.id = sd."patientId"
      WHERE p."houseId" = ${String(houseId)} AND sd.date = ${String(date)}
    `;
    res.json(rows);
  } catch (e) {
    console.error("Get distributions error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/", async (req: AuthRequest, res: Response) => {
  try {
    const { patientId, shift, date, status } = req.body;
    await prisma.$executeRaw`
      INSERT INTO "ShiftDist" ("patientId", "shift", "date", "status")
      VALUES (${patientId}, ${shift}, ${date}, ${status})
      ON CONFLICT ("patientId", "shift", "date") DO UPDATE SET "status" = ${status}
    `;
    res.json({ patientId, shift, date, status });
  } catch (e) {
    console.error("Upsert distribution error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
