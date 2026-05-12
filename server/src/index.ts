import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import prisma from "./lib/prisma";
import authRoutes from "./routes/auth";
import housesRoutes from "./routes/houses";
import usersRoutes from "./routes/users";
import patientsRoutes from "./routes/patients";
import roomsRoutes from "./routes/rooms";
import shiftsRoutes from "./routes/shifts";
import consequencesRoutes from "./routes/consequences";
import phonesRoutes from "./routes/phones";
import financeRoutes from "./routes/finance";
import groupsRoutes from "./routes/groups";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/houses", housesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/patients", patientsRoutes);
app.use("/api/rooms", roomsRoutes);
app.use("/api/shifts", shiftsRoutes);
app.use("/api/consequences", consequencesRoutes);
app.use("/api/phones", phonesRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/groups", groupsRoutes);

async function ensureSchema() {
  try {
    await prisma.$executeRaw`ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'therapeutic'`;
    await prisma.$executeRaw`ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "time" TEXT NOT NULL DEFAULT ''`;
    await prisma.$executeRaw`ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active'`;
    await prisma.$executeRaw`ALTER TABLE "GroupAttendance" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'present'`;
    console.log("Schema ensured");
  } catch (e) {
    console.error("Schema migration error:", e);
  }
}

ensureSchema().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
