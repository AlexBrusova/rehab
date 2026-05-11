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
  try {
    const { password, name, username, role, roleLabel, initials, color, phone, allHousesAccess, houseId } = req.body;
    const passwordHash = await bcrypt.hash(password || "1234", 10);
    const user = await prisma.user.create({
      data: { name, username, role, roleLabel, initials, color: color || "#1e5fa8",
              phone, allHousesAccess: allHousesAccess || false, houseId: houseId || null, passwordHash },
    });
    const { passwordHash: _, ...safe } = user;
    res.status(201).json(safe);
  } catch (e) {
    console.error("Create user error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const { password, name, username, role, roleLabel, initials, color, phone, allHousesAccess, houseId } = req.body;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (username !== undefined) data.username = username;
    if (role !== undefined) data.role = role;
    if (roleLabel !== undefined) data.roleLabel = roleLabel;
    if (initials !== undefined) data.initials = initials;
    if (color !== undefined) data.color = color;
    if (phone !== undefined) data.phone = phone;
    if (allHousesAccess !== undefined) data.allHousesAccess = allHousesAccess;
    if (houseId !== undefined) data.houseId = houseId;
    if (password) data.passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({ where: { id }, data });
    const { passwordHash: _, ...safe } = user;
    res.json(safe);
  } catch (e) {
    console.error("Update user error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
