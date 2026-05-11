import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";

const router = Router();
router.use(authMiddleware);

router.get("/", async (_req: AuthRequest, res: Response) => {
  const houses = await prisma.house.findMany({ orderBy: { name: "asc" } });
  res.json(houses);
});

export default router;
