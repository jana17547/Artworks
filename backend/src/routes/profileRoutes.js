import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/profile", verifyToken, (req, res) => {
  res.json({ userId: req.userId, role: req.role });
});

export default router;
