import { Router } from "express";
import {
    registerDonor,
    loginDonor,
    logoutDonor,
    refreshAccessToken,
    getCurrentDonor,
    updateDonorProfile,
    changeCurrentPassword,
    getDonationHistory,
    checkDonationEligibility,
    updateOwnDonationDate,
} from "../controllers/donor.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    verifyDonorJWT,
    verifyDonorAccount,
} from "../middlewares/donor.middleware.js";

const router = Router();

// Public routes (no authentication required)
router.route("/register").post(upload.single("profilePhoto"), registerDonor);

router.route("/login").post(loginDonor);
router.route("/refresh-token").post(refreshAccessToken);

// Protected routes (require donor authentication)
router.route("/logout").post(verifyDonorJWT, logoutDonor);
router.route("/profile").get(verifyDonorJWT, getCurrentDonor);
router
    .route("/profile")
    .patch(verifyDonorJWT, upload.single("profilePhoto"), updateDonorProfile);

router.route("/change-password").post(verifyDonorJWT, changeCurrentPassword);

// Donor account specific routes (require active account)
router
    .route("/donation-history")
    .get(verifyDonorJWT, verifyDonorAccount, getDonationHistory);

router
    .route("/check-eligibility")
    .get(verifyDonorJWT, verifyDonorAccount, checkDonationEligibility);

// Allow donors to update their own donation records
router
    .route("/update-donation")
    .put(verifyDonorJWT, verifyDonorAccount, updateOwnDonationDate);

export default router;
