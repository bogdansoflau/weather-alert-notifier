import express, { Request, Response } from "express";
import cors from "cors";
import authRoutes from "./routes/auth";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/health", (_req: Request, res: Response): void => {
  res.json({ status: "ok" });
});

export default app;
