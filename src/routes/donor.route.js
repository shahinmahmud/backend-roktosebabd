import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyAdmin, verifyJWT } from "../middlewares/auth.middleware.js";
import {
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

    addDonor,
    deleteDonor,
    getDonorDetails,
    getDonors,
    updateDonationDate,
    updateDonor,
    approveDonor,
    rejectDonor,
    getAllDonorsAdmin,
    getDonorDetailsAdmin,
    getDonorByDonorId,
} from "../controllers/donor.controller.js";

const router = Router();

// Public Routes (Limited Information)
router.route("/").get(getDonors); // Public - only name, gender, religion, profession, address
router.route("/:id").get(getDonorDetails); // Public - limited fields
router.route("/search/:donorId").get(getDonorByDonorId); // Search by donorId - public

// Legacy admin add donor route
router.route("/").post(upload.single("profilePhoto"), addDonor);

// Admin Routes (Complete Information)
router.route("/admin/all").get(verifyJWT, verifyAdmin, getAllDonorsAdmin); // Admin - all fields + statistics
router.route("/admin/:id").get(verifyJWT, verifyAdmin, getDonorDetailsAdmin); // Admin - complete details
router.route("/admin/:id").put(verifyJWT, verifyAdmin, updateDonor);
router.route("/admin/:id").delete(verifyJWT, verifyAdmin, deleteDonor);

// Medical Staff routes (for donation management)
router.route("/:id/update-donation").put(verifyJWT, updateDonationDate);
router.route("/:donorId/approve").put(verifyJWT, approveDonor);
router.route("/:donorId/reject").put(verifyJWT, rejectDonor);

export default router;
