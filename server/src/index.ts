import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import housesRoutes from "./routes/houses";
import usersRoutes from "./routes/users";
import patientsRoutes from "./routes/patients";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:4173",
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some((o) => origin.startsWith(o))) cb(null, true);
    else cb(new Error("Not allowed by CORS"));
  },
}));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/houses", housesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/patients", patientsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
