// src/routes/adminDashboard.route.js
import express from "express";
import { getAdminDashboardStats } from "../controllers/adminDashboard.controller.js";
import { verifyAdmin, verifyJWT } from "../middlewares/auth.middleware.js";
import { createRequire } from 'module';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var module = { exports: {} };

const require = createRequire(import.meta.url);

const router = express.Router();

// GET /api/admin/dashboard-stats
router.get("/dashboard-stats", verifyJWT, verifyAdmin, getAdminDashboardStats);

export default router;
