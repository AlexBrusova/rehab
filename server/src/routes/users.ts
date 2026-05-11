import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, username: true, role: true, roleLabel: true,
              initials: true, color: true, houseId: true, allHousesAccess: true,
              allowedHouses: true, phone: true },
    orderBy: { name: "asc" },
  });
  res.json(users);
});

router.post("/", async (req: AuthRequest, res: Response) => {
  const { password, ...rest } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { ...rest, passwordHash } });
  const { passwordHash: _, ...safe } = user;
  res.status(201).json(safe);
});

router.patch("/:id", async (req: AuthRequest, res: Response) => {
  const { password, ...rest } = req.body;
  const data: Record<string, unknown> = { ...rest };
  if (password) data.passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.update({ where: { id: req.params.id }, data });
  const { passwordHash: _, ...safe } = user;
  res.json(safe);
});

export default router;
