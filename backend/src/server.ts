import express, { Request, Response } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import cors from "cors";

dotenv.config();
console.log("JWT_SECRET is:", process.env.JWT_SECRET ? "[SET]" : "[MISSING]");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// Connect MongoDB
mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error", err));

// Mount auth
app.use("/api/auth", authRoutes);

// Health-check
app.get("/health", (_req: Request, res: Response): void => {
  res.json({ status: "ok" });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`🚀 Backend listening on ${port}`));
