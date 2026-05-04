import { Donor } from "../models/donor.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    uploadOnCloudinary,
    uploadBufferOnCloudinary,
    deleteFromCloudinary,
    getPublicIdFromUrl,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

// Helper function to generate access and refresh tokens
const generateAccessAndRefreshTokens = async (donorId) => {
    try {
        const donor = await Donor.findById(donorId);
        const accessToken = donor.generateAccessToken();
        const refreshToken = donor.generateRefreshToken();

        donor.refreshToken = refreshToken;
        await donor.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating refresh and access token"
        );
    }
};

// Donor Registration
const registerDonor = asyncHandler(async (req, res) => {
    const {
        name,
        phone,
        city,
        location,
        address,
        bloodGroup,
        gender,
        religion,
        dateOfBirth,
        password,
        email,
        profession,
        weight,
        height,
        nationalId,
        emergencyContact,
        // New optional initial donation fields
        initialTotalDonations,
        initialLastDonationDate,
    } = req.body;

    // Validate required fields
    const requiredFields = [
        name,
        phone,
        city,
        location,
        address,
        bloodGroup,
        gender,
        religion,
        dateOfBirth,
        password,
    ];
    if (requiredFields.some((field) => !field?.trim())) {
        throw new ApiError(400, "All required fields must be provided");
    }

    // // Check if donor already exists
    // const existedDonor = await Donor.findOne({
    //     $or: [
    //         { phone },
    //         { email: email?.trim() || null },
    //         { nationalId: nationalId?.trim() || null },
    //     ].filter((condition) => Object.values(condition)[0]),
    // });

    // if (existedDonor) {
    //     throw new ApiError(
    //         409,
    //         "Donor with this phone, email or national ID already exists"
    //     );
    // }

    // Check if donor already exists for each field and send specific error
    if (phone && (await Donor.findOne({ phone: phone.trim() }))) {
        throw new ApiError(409, "এই ফোন নম্বরটি ইতোমধ্যে ব্যবহৃত হয়েছে");
    }
    if (
        email?.trim() &&
        (await Donor.findOne({ email: email.trim().toLowerCase() }))
    ) {
        throw new ApiError(409, "এই ইমেইলটি ইতোমধ্যে ব্যবহৃত হয়েছে");
    }
    if (
        nationalId?.trim() &&
        (await Donor.findOne({ nationalId: nationalId.trim() }))
    ) {
        throw new ApiError(
            409,
            "এই জাতীয় পরিচয়পত্র নম্বরটি ইতোমধ্যে ব্যবহৃত হয়েছে"
        );
    }

    // Handle profile photo upload
    let profilePhotoUrl = "";
    if (
        req.file &&
        req.file.buffer &&
        req.file.mimetype &&
        req.file.originalname
    ) {
        const profilePhoto = await uploadBufferOnCloudinary(
            req.file.buffer,
            req.file.mimetype,
            req.file.originalname,
            "donor"
        );
        if (profilePhoto) {
            profilePhotoUrl = profilePhoto.url;
        }
    }

    // Create donor payload
    const donorData = {
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
        location: location.trim(),
        address: address.trim(),
        bloodGroup,
        gender,
        religion,
        dateOfBirth: new Date(dateOfBirth),
        password,
        profilePhoto: profilePhotoUrl,
    };

    // Add optional fields if provided
    if (email?.trim()) donorData.email = email.trim().toLowerCase();
    if (profession?.trim()) donorData.profession = profession.trim();
    if (weight) donorData.weight = parseFloat(weight);
    if (height) donorData.height = parseFloat(height);
    if (nationalId?.trim()) donorData.nationalId = nationalId.trim();
    if (emergencyContact?.name?.trim())
        donorData.emergencyContact = emergencyContact;

    // Add initial donation data if provided
    if (initialTotalDonations && initialTotalDonations > 0) {
        donorData.initialTotalDonations = parseInt(initialTotalDonations);
    }
    if (initialLastDonationDate) {
        donorData.initialLastDonationDate = new Date(initialLastDonationDate);
    }

    // Create donor
    const donor = await Donor.create(donorData);

    // Initialize donor with donation data and eligibility check
    if (donor.initialTotalDonations > 0 || donor.initialLastDonationDate) {
        donor.initializeWithDonationData();
        await donor.save();
    }

    // Remove password from response
    const createdDonor = await Donor.findById(donor._id).select(
        "-password -refreshToken"
    );

    if (!createdDonor) {
        throw new ApiError(500, "Something went wrong while registering donor");
    }

    res.status(201).json(
        new ApiResponse(
            201,
            {
                ...createdDonor.toObject(),
                donorId: createdDonor.donorId,
            },
            `Donor registered successfully with ID: ${createdDonor.donorId}. Account is active and ready to use.`
        )
    );
});

// Donor Login
const loginDonor = asyncHandler(async (req, res) => {
    const { phone, email, password } = req.body;

    if (!password) {
        throw new ApiError(400, "Password is required");
    }

    if (!phone && !email) {
        throw new ApiError(400, "Phone number or email is required");
    }

    const donor = await Donor.findOne({
        $or: [
            { phone: phone?.trim() },
            { email: email?.trim()?.toLowerCase() },
        ].filter((condition) => Object.values(condition)[0]),
    });

    if (!donor) {
        throw new ApiError(404, "Donor does not exist");
    }

    const isPasswordValid = await donor.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid donor credentials");
    }

    if (donor.accountStatus === "SUSPENDED") {
        throw new ApiError(
            403,
            "Account is suspended. Please contact administration."
        );
    }

    if (donor.accountStatus === "INACTIVE") {
        throw new ApiError(
            403,
            "Account is inactive. Please contact administration."
        );
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        donor._id
    );

    // Update last login date
    donor.lastLoginDate = new Date();
    await donor.save({ validateBeforeSave: false });

    const loggedInDonor = await Donor.findById(donor._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    donor: loggedInDonor,
                    accessToken,
                    refreshToken,
                },
                "Donor logged in successfully"
            )
        );
});

// Donor Logout
const logoutDonor = asyncHandler(async (req, res) => {
    await Donor.findByIdAndUpdate(
        req.donor._id,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Donor logged out"));
});

// Refresh Access Token
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const donor = await Donor.findById(decodedToken?._id);

        if (!donor) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== donor?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true,
        };

        const { accessToken, refreshToken } =
            await generateAccessAndRefreshTokens(donor._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

// Get Current Donor Profile
const getCurrentDonor = asyncHandler(async (req, res) => {
    let donor = req.donor;
    // Always convert to plain JS object
    if (typeof donor.toObject === "function") {
        donor = donor.toObject();
    }
    // emergencyContact যদি string হয়, তাহলে object বানিয়ে দিন
    if (typeof donor.emergencyContact === "string") {
        try {
            donor.emergencyContact = JSON.parse(donor.emergencyContact);
        } catch {
            donor.emergencyContact = { name: "", phone: "", relation: "" };
        }
    }
    return res
        .status(200)
        .json(new ApiResponse(200, donor, "Donor fetched successfully"));
});

// Update Donor Profile
const updateDonorProfile = asyncHandler(async (req, res) => {
    const {
        name,
        phone,
        email,
        city,
        location,
        address,
        profession,
        weight,
        height,
        bloodGroup,
        gender,
        religion,
        dateOfBirth,
        emergencyContact,
        privacySettings,
    } = req.body;

    const updateData = {};

    // Allow donors to update all fields
    if (name?.trim()) updateData.name = name.trim();
    if (phone?.trim()) updateData.phone = phone.trim();
    if (email?.trim()) updateData.email = email.trim().toLowerCase();
    if (city?.trim()) updateData.city = city.trim();
    if (location?.trim()) updateData.location = location.trim();
    if (address?.trim()) updateData.address = address.trim();
    if (profession?.trim()) updateData.profession = profession.trim();
    if (weight) updateData.weight = parseFloat(weight);
    if (height) updateData.height = parseFloat(height);
    if (bloodGroup?.trim()) updateData.bloodGroup = bloodGroup.trim();
    if (gender?.trim()) updateData.gender = gender.trim();
    if (religion?.trim()) updateData.religion = religion.trim();
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (emergencyContact) updateData.emergencyContact = emergencyContact;
    if (privacySettings) updateData.privacySettings = privacySettings;

    // Handle profile photo upload
    if (
        req.file &&
        req.file.buffer &&
        req.file.mimetype &&
        req.file.originalname
    ) {
        // Get existing donor to check for old profile photo
        const existingDonor = await Donor.findById(req.donor._id).select(
            "profilePhoto"
        );
        const oldImageUrl = existingDonor?.profilePhoto;

        const profilePhoto = await uploadBufferOnCloudinary(
            req.file.buffer,
            req.file.mimetype,
            req.file.originalname,
            "donor",
            oldImageUrl
        );
        if (profilePhoto) {
            updateData.profilePhoto = profilePhoto.url;
        }
    }

    const donor = await Donor.findByIdAndUpdate(
        req.donor._id,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, donor, "Profile updated successfully"));
});

// Change Password
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required");
    }

    const donor = await Donor.findById(req.donor._id);
    const isPasswordCorrect = await donor.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    donor.password = newPassword;
    await donor.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

// Get Donor Donation History
const getDonationHistory = asyncHandler(async (req, res) => {
    const donor = await Donor.findById(req.donor._id).select(
        "donationHistory totalDonations lastDonationDate nextEligibleDate"
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, donor, "Donation history fetched successfully")
        );
});

// Check Donation Eligibility
const checkDonationEligibility = asyncHandler(async (req, res) => {
    const donor = await Donor.findById(req.donor._id);
    const eligibilityCheck = donor.checkDonationEligibility();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                eligibilityCheck,
                "Eligibility checked successfully"
            )
        );
});

// Legacy Admin Functions (Updated for new model)
const addDonor = asyncHandler(async (req, res) => {
    // This is for admin to manually add donor (legacy support)
    const {
        name,
        phone,
        city,
        location,
        address,
        bloodGroup,
        gender,
        religion,
        dateOfBirth,
    } = req.body;

    [
        name,
        phone,
        city,
        location,
        address,
        bloodGroup,
        gender,
        religion,
        dateOfBirth,
    ].forEach((item) => {
        if (!item) throw new ApiError(400, "Please provide required data");
    });

    const existedDonor = await Donor.findOne({ phone });

    if (existedDonor) {
        throw new ApiError(400, "Phone number already exists");
    }

    let profilePhoto = "";
    if (
        req.file &&
        req.file.buffer &&
        req.file.mimetype &&
        req.file.originalname
    ) {
        const uploadResult = await uploadBufferOnCloudinary(
            req.file.buffer,
            req.file.mimetype,
            req.file.originalname,
            "donor"
        );
        profilePhoto = uploadResult?.url || "";
    }

    const createDonorPayload = {
        ...req.body,
        profilePhoto,
        password: "Password123", // Admin added donors get default password
        accountStatus: "ACTIVE", // Admin approved
        eligibilityStatus: "ELIGIBLE",
    };

    const createdDonor = await Donor.create(createDonorPayload);
    const donorResponse = await Donor.findById(createdDonor._id).select(
        "-password -refreshToken"
    );

    res.status(201).json(
        new ApiResponse(201, donorResponse, "Donor added successfully by admin")
    );
});

const updateDonor = asyncHandler(async (req, res) => {
    const updatedDonor = await Donor.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true,
        }
    ).select("-password -refreshToken");

    if (!updatedDonor) {
        throw new ApiError(404, "Donor not found");
    }

    res.status(200).json(
        new ApiResponse(200, updatedDonor, "Donor updated successfully")
    );
});

const deleteDonor = asyncHandler(async (req, res) => {
    const donor = await Donor.findById(req.params.id);

    if (!donor) {
        throw new ApiError(404, "Donor not found");
    }

    // Delete profile photo from cloudinary if exists
    if (donor.profilePhoto) {
        try {
            const publicId = getPublicIdFromUrl(donor.profilePhoto);
            if (publicId) {
                await deleteFromCloudinary(publicId);
            }
        } catch (error) {
            console.log("Error deleting profile photo from cloudinary:", error);
            // Continue with deletion even if cloudinary fails
        }
    }

    // Delete donor from database
    const deletedDonor = await Donor.findByIdAndDelete(req.params.id);

    res.status(200).json(
        new ApiResponse(200, deletedDonor, "Donor deleted successfully")
    );
});

// Public Route - Limited Information Only
const getDonors = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20, // Admin এর মতো বেশি limit
        bloodGroup,
        city,
        location,
        gender,
        eligibilityStatus,
        search,
        donorId,
    } = req.query;

    // Ensure numeric page and limit
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;

    const filter = {
        accountStatus: "ACTIVE", // Only show active donors publicly
        eligibilityStatus: "ELIGIBLE", // Only show eligible donors publicly
    };

    // Admin এর মতো filtering approach
    if (bloodGroup && bloodGroup.trim()) {
        filter.bloodGroup = bloodGroup.trim(); // Exact match
    }

    if (city && city.trim()) {
        filter.city = new RegExp(city.trim(), "i"); // Case insensitive like admin
    }

    if (location && location.trim()) {
        filter.location = new RegExp(location.trim(), "i"); // Case insensitive like admin
    }

    if (gender && gender.trim()) {
        filter.gender = gender.trim(); // Exact match
    }

    // Enhanced search functionality (Admin style)
    if (search && search.trim()) {
        const searchTerm = search.trim();
        filter.$or = [
            { name: new RegExp(searchTerm, "i") },
            { address: new RegExp(searchTerm, "i") },
            { city: new RegExp(searchTerm, "i") },
            { location: new RegExp(searchTerm, "i") },
            { profession: new RegExp(searchTerm, "i") },
            { donorId: new RegExp(searchTerm, "i") },
        ];
    }

    // Direct donorId search (Admin style - case insensitive)
    if (donorId && donorId.trim()) {
        // Remove search filter if donorId is provided for exact match
        if (filter.$or) delete filter.$or;
        filter.donorId = new RegExp(donorId.trim(), "i");
    }

    // Public fields only - Name, Gender, Religion, Profession, Address, Blood Group, Donor ID
    const publicFields =
        "donorId name gender religion profession address bloodGroup city location profilePhoto totalDonations lastDonationDate";

    const donors = await Donor.find(filter)
        .select(publicFields)
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .sort({ createdAt: -1 });

    const total = await Donor.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json(
        new ApiResponse(
            200,
            {
                donors,
                totalPages,
                currentPage: pageNum,
                total,
            },
            "Public donors list fetched successfully"
        )
    );
});

// Admin Route - Complete Information
const getAllDonorsAdmin = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        bloodGroup,
        city,
        location,
        gender,
        eligibilityStatus,
        accountStatus,
        search,
        donorId,
    } = req.query;

    const filter = {};
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (city) filter.city = new RegExp(city, "i");
    if (location) filter.location = new RegExp(location, "i");
    if (gender) filter.gender = gender;
    if (eligibilityStatus) filter.eligibilityStatus = eligibilityStatus;
    if (accountStatus) filter.accountStatus = accountStatus;

    // Direct donorId search (exact match)
    if (donorId) {
        filter.donorId = new RegExp(donorId, "i");
    }

    // Search by name, phone, or donorId
    if (search) {
        filter.$or = [
            { name: new RegExp(search, "i") },
            { phone: new RegExp(search, "i") },
            { donorId: new RegExp(search, "i") },
        ];
    }

    // Admin can see all fields except password and refreshToken
    const donors = await Donor.find(filter)
        .select("-password -refreshToken")
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });
    // Remove the populate since verifiedBy doesn't exist in donationHistory schema

    const total = await Donor.countDocuments(filter);

    // Additional statistics for admin
    const stats = {
        totalDonors: await Donor.countDocuments({}),
        activeDonors: await Donor.countDocuments({ accountStatus: "ACTIVE" }),
        pendingDonors: await Donor.countDocuments({ accountStatus: "PENDING" }),
        eligibleDonors: await Donor.countDocuments({
            eligibilityStatus: "ELIGIBLE",
        }),
        totalDonations: await Donor.aggregate([
            { $group: { _id: null, total: { $sum: "$totalDonations" } } },
        ]),
    };

    res.status(200).json(
        new ApiResponse(
            200,
            {
                donors,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total,
                statistics: {
                    ...stats,
                    totalDonations: stats.totalDonations[0]?.total || 0,
                },
            },
            "Admin donors list fetched successfully"
        )
    );
});

const getDonorDetails = asyncHandler(async (req, res) => {
    // Public route - limited information
    const donor = await Donor.findById(req.params.id)
        .select(
            "name gender religion profession address bloodGroup city location profilePhoto totalDonations lastDonationDate"
        )
        .where({ accountStatus: "ACTIVE", eligibilityStatus: "ELIGIBLE" });

    if (!donor) {
        throw new ApiError(404, "Donor not found or not available publicly");
    }

    res.status(200).json(
        new ApiResponse(200, donor, "Public donor details found successfully")
    );
});

// Admin Route - Complete donor details
const getDonorDetailsAdmin = asyncHandler(async (req, res) => {
    const donor = await Donor.findById(req.params.id).select(
        "-password -refreshToken"
    );

    if (!donor) {
        throw new ApiError(404, "Donor not found");
    }

    res.status(200).json(
        new ApiResponse(200, donor, "Admin donor details found successfully")
    );
});

// Search donor by donorId (Public + Admin)
const getDonorByDonorId = asyncHandler(async (req, res) => {
    const { donorId } = req.params;

    const donor = await Donor.findOne({ donorId }).select(
        "-password -refreshToken"
    );

    if (!donor) {
        throw new ApiError(404, "Donor not found with this ID");
    }

    // For public route, check if donor is active
    if (!req.user && donor.accountStatus !== "ACTIVE") {
        throw new ApiError(404, "Donor not found or not available publicly");
    }

    res.status(200).json(
        new ApiResponse(
            200,
            donor,
            `Donor found successfully with ID: ${donorId}`
        )
    );
});

const updateDonationDate = asyncHandler(async (req, res) => {
    const { lastDonationDate, verifiedBy, location, bloodBank, units, notes } =
        req.body;

    const donor = await Donor.findById(req.params.id);

    if (!donor) {
        throw new ApiError(404, "Donor not found");
    }

    // Add donation record
    const donationRecord = {
        donationDate: new Date(lastDonationDate),
        location: location || "",
        bloodBank: bloodBank || "",
        units: units || 1,
        notes: notes || "",
        verifiedBy: verifiedBy || req.user._id, // Medical staff who is updating
    };

    donor.addDonation(donationRecord);
    await donor.save();

    const updatedDonor = await Donor.findById(req.params.id).select(
        "-password -refreshToken"
    );

    res.status(201).json(
        new ApiResponse(
            201,
            updatedDonor,
            "Donor donation record updated successfully"
        )
    );
});

// Donor updates their own donation record (authenticated route)
const updateOwnDonationDate = asyncHandler(async (req, res) => {
    const { lastDonationDate, location, bloodBank, units, notes } = req.body;

    const donor = await Donor.findById(req.donor._id);

    if (!donor) {
        throw new ApiError(404, "Donor not found");
    }

    // Add donation record
    const donationRecord = {
        donationDate: new Date(lastDonationDate),
        location: location || "",
        bloodBank: bloodBank || "",
        units: units || 1,
        notes: notes || "",
        verifiedBy: req.donor._id, // Self-reported by donor
    };

    donor.addDonation(donationRecord);
    await donor.save();

    const updatedDonor = await Donor.findById(req.donor._id).select(
        "-password -refreshToken"
    );

    res.status(201).json(
        new ApiResponse(
            201,
            updatedDonor,
            "Donation record updated successfully"
        )
    );
});

// Medical Staff Functions
const approveDonor = asyncHandler(async (req, res) => {
    const { donorId } = req.params;
    const { eligibilityStatus, notes } = req.body;

    const donor = await Donor.findByIdAndUpdate(
        donorId,
        {
            accountStatus: "ACTIVE",
            eligibilityStatus: eligibilityStatus || "ELIGIBLE",
        },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    if (!donor) {
        throw new ApiError(404, "Donor not found");
    }

    res.status(200).json(
        new ApiResponse(200, donor, "Donor approved successfully")
    );
});

const rejectDonor = asyncHandler(async (req, res) => {
    const { donorId } = req.params;
    const { reason } = req.body;

    const donor = await Donor.findByIdAndUpdate(
        donorId,
        {
            accountStatus: "INACTIVE",
            eligibilityStatus: "PERMANENTLY_INELIGIBLE",
        },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    if (!donor) {
        throw new ApiError(404, "Donor not found");
    }

    res.status(200).json(
        new ApiResponse(200, donor, "Donor rejected successfully")
    );
});

export {
    // Donor Authentication Functions
    registerDonor,
    loginDonor,
    logoutDonor,
    refreshAccessToken,
    getCurrentDonor,
    updateDonorProfile,
    changeCurrentPassword,
    getDonationHistory,
    checkDonationEligibility,

    // Public Functions (Limited Information)
    getDonors, // Public route - limited fields
    getDonorDetails, // Public route - limited fields
    getDonorByDonorId, // Search by donorId - public/admin

    // Admin Functions (Complete Information)
    getAllDonorsAdmin, // Admin route - all fields
    getDonorDetailsAdmin, // Admin route - all fields
    addDonor,
    updateDonor,
    deleteDonor,
    updateDonationDate,
    updateOwnDonationDate,

    // Medical Staff Functions
    approveDonor,
    rejectDonor,
};
