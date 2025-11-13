import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aiRoutes from "./routes/aiRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Root route check
app.get("/", (req, res) => {
  res.send("✅ MYJARVIS Backend Running with Gemini!");
});

// ✅ AI routes
app.use("/api/ai", aiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
