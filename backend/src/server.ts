import "dotenv/config";
import mongoose from "mongoose";
import app from "./app";

// Connect MongoDB
mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error", err));

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`🚀 Backend listening on ${port}`));
