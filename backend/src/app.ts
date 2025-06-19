import express, { Request, Response } from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import apiRoutes from "./routes/api";
import { geocodeHandler } from "./controllers/geocodeController";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api", apiRoutes);

app.get("/health", (_req: Request, res: Response): void => {
  res.json({ status: "ok" });
});

export default app;
