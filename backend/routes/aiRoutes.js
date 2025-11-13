/**
 * backend/routes/aiRoutes.js
 */
import express from "express";
import { aiChat } from "../controllers/aiController.js";

const router = express.Router();

// POST /api/ai/chat
router.post("/chat", aiChat);

export default router;
