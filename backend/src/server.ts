import "dotenv/config";
import mongoose from "mongoose";
import app from "./app";

console.log("JWT_SECRET is:", process.env.JWT_SECRET ? "[SET]" : "[MISSING]");

// Connect MongoDB
mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error", err));

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`🚀 Backend listening on ${port}`));
