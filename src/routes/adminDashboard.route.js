// src/routes/adminDashboard.route.js
import express from "express";
import { getAdminDashboardStats } from "../controllers/adminDashboard.controller.js";
import { verifyAdmin, verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// GET /api/admin/dashboard-stats
router.get("/dashboard-stats", verifyJWT, verifyAdmin, getAdminDashboardStats);

export default router;
