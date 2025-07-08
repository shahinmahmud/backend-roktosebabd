import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { Donor } from "../models/donor.model.js";

export const verifyDonorJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        // Check if this is a donor token
        if (decodedToken.role !== "DONOR") {
            throw new ApiError(401, "Invalid token type");
        }

        const donor = await Donor.findById(decodedToken?._id).select("-password -refreshToken");

        if (!donor) {
            throw new ApiError(401, "Invalid Access Token");
        }

        // Check if account is active
        if (donor.accountStatus === "SUSPENDED") {
            throw new ApiError(403, "Account is suspended");
        }

        if (donor.accountStatus === "INACTIVE") {
            throw new ApiError(403, "Account is inactive");
        }

        req.donor = donor;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});

// Middleware to check if donor account is fully verified
export const verifyDonorAccount = asyncHandler(async (req, _, next) => {
    if (req.donor.accountStatus !== "ACTIVE") {
        throw new ApiError(403, "Account is not yet activated. Please wait for admin approval.");
    }
    next();
});

// Middleware to check donation eligibility
export const checkDonationEligible = asyncHandler(async (req, _, next) => {
    const eligibilityCheck = req.donor.checkDonationEligibility();
    
    if (!eligibilityCheck.eligible) {
        throw new ApiError(400, eligibilityCheck.reason);
    }
    
    req.eligibilityCheck = eligibilityCheck;
    next();
});
