import { Router } from "express";
import {
    getAllTeamMembers,
    getAllTeamMembersForAdmin,
    getTeamMemberById,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
    updateDisplayOrder,
} from "../controllers/teamMember.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public routes
router.route("/").get(getAllTeamMembers);

// Protected routes (Admin only)
router.route("/admin").get(verifyJWT, getAllTeamMembersForAdmin);
router.route("/admin/:id").get(verifyJWT, getTeamMemberById);
router
    .route("/admin/create")
    .post(verifyJWT, upload.single("image"), createTeamMember);
router
    .route("/admin/:id")
    .put(verifyJWT, upload.single("image"), updateTeamMember)
    .delete(verifyJWT, deleteTeamMember);
router.route("/admin/update-order").patch(verifyJWT, updateDisplayOrder);

export default router;
