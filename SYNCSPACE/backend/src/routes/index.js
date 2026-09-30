import { Router } from "express";
import authRoutes from "./auth.routes.js";
import aiRoutes from "./ai.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import roomRoutes from "./room.routes.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
router.get("/health", (req, res) => {
  res.json({ success: true, data: { status: "ok", service: "syncspace-api" } });
});
router.use("/auth", authRoutes);
router.use(requireAuth);
router.use("/ai", aiRoutes);
router.use("/rooms", roomRoutes);
router.use("/dashboard", dashboardRoutes);
export default router;
