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
import therapyRoutes from "./routes/therapy";
import summaryRoutes from "./routes/summary";
import medsRoutes from "./routes/meds";
import distributionsRoutes from "./routes/distributions";
import therapistAssignmentsRoutes from "./routes/therapistAssignments";
import scheduleRoutes from "./routes/schedule";

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
app.use("/api/therapy", therapyRoutes);
app.use("/api/summary", summaryRoutes);
app.use("/api/meds", medsRoutes);
app.use("/api/distributions", distributionsRoutes);
app.use("/api/therapist-assignments", therapistAssignmentsRoutes);
app.use("/api/schedule", scheduleRoutes);

async function step(name: string, fn: () => Promise<any>) {
  try {
    await fn();
    console.log(`Schema step OK: ${name}`);
  } catch (e: any) {
    console.error(`Schema step SKIP (${name}):`, e?.message ?? e);
  }
}

async function ensureSchema() {
  await step("Group.type", () => prisma.$executeRaw`ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'therapeutic'`);
  await step("Group.time", () => prisma.$executeRaw`ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "time" TEXT NOT NULL DEFAULT ''`);
  await step("Group.status", () => prisma.$executeRaw`ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active'`);
  await step("GroupAttendance.status", () => prisma.$executeRaw`ALTER TABLE "GroupAttendance" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'present'`);
  await step("TherapySession.urgency->text", () => prisma.$executeRaw`ALTER TABLE "TherapySession" ALTER COLUMN "urgency" TYPE TEXT USING urgency::text`);
  await step("ShiftDist table", () => prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "ShiftDist" (
    "patientId" TEXT NOT NULL,
    "shift"     TEXT NOT NULL,
    "date"      TEXT NOT NULL,
    "status"    TEXT,
    PRIMARY KEY ("patientId", "shift", "date")
  )`);
  console.log("ensureSchema complete");
}

ensureSchema().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
