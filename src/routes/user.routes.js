import { Router } from "express";
import {
    getUserDetails,
    getUsers,
    loginUser,
    registerUser,
    updateUser,
    deleteUser,
    getUserProfile,
    getAdminProfile,
    updateAdminProfile,
    changeAdminPassword,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyAdmin, verifyJWT } from "../middlewares/auth.middleware.js";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const router = Router();

router.route("/register").post(upload.single("profilePhoto"), registerUser);
router.route("/login").post(loginUser);

// User profile route (authenticated but not admin-only)
router.route("/profile").get(verifyJWT, getUserProfile);

// Admin profile routes
router.route("/admin/profile").get(verifyJWT, verifyAdmin, getAdminProfile);
router
    .route("/admin/profile")
    .put(
        verifyJWT,
        verifyAdmin,
        upload.single("profilePhoto"),
        updateAdminProfile
    );
router
    .route("/admin/change-password")
    .put(verifyJWT, verifyAdmin, changeAdminPassword);

// Secured Routes

// Admin routes
router.route("/").get(verifyJWT, verifyAdmin, getUsers);
router.route("/:id").get(verifyJWT, verifyAdmin, getUserDetails);
router.route("/:id").put(verifyJWT, verifyAdmin, updateUser);
router.route("/:id").delete(verifyJWT, verifyAdmin, deleteUser);

export default router;
