import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    uploadOnCloudinary,
    uploadBufferOnCloudinary,
    deleteFromCloudinary,
    getPublicIdFromUrl,
} from "../utils/cloudinary.js";

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating tokens!"
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, confirmPassword, address, bloodGroup } =
        req.body;

    [name, address, bloodGroup].forEach((item) => {
        if (!item) throw new ApiError(400, "Please provide required data");
    });

    // Parse address if it's a string (from form data)
    const parsedAddress =
        typeof address === "string" ? JSON.parse(address) : address;

    const existedMobileNumber = await User.findOne({
        "address.mobileNumber": parsedAddress.mobileNumber,
    });

    if (existedMobileNumber) {
        throw new ApiError(400, "Mobile Number already exist");
    }

    if (email) {
        const isEmailExist = await User.findOne({ email });

        if (isEmailExist) {
            throw new ApiError(400, "Email already exist");
        }
    }

    if (password) {
        if (password !== confirmPassword) {
            throw new ApiError(400, "Confirm password doesnot match");
        }
    }

    let profilePhoto = "";
    if (
        req.file &&
        req.file.buffer &&
        req.file.mimetype &&
        req.file.originalname
    ) {
        const cloudinaryRes = await uploadBufferOnCloudinary(
            req.file.buffer,
            req.file.mimetype,
            req.file.originalname,
            "user"
        );
        if (cloudinaryRes) {
            profilePhoto = cloudinaryRes.url;
        }
    }

    const createUserPayload = {
        ...req.body,
        address: {
            street: parsedAddress.street || "",
            city: parsedAddress.city || "",
            district: parsedAddress.district || "",
            division: parsedAddress.division || "",
            postalCode: parsedAddress.postalCode || "",
            mobileNumber: parsedAddress.mobileNumber,
            // Keep addressLine for backward compatibility
            addressLine:
                parsedAddress.addressLine ||
                `${parsedAddress.street || ""}, ${parsedAddress.city || ""}, ${parsedAddress.district || ""}, ${parsedAddress.division || ""}`
                    .replace(/^,\s*|,\s*$/g, "")
                    .replace(/,\s*,/g, ","),
        },
        profilePhoto: profilePhoto.url || "",
    };

    const createdUser = await User.create(createUserPayload);

    const userWithoutSensitiveFields = await User.find(createdUser._id).select(
        "-password -refreshToken -__v"
    );

    res.status(201).json(
        new ApiResponse(
            201,
            userWithoutSensitiveFields,
            "User registerd successfully"
        )
    );
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    [email, password].forEach((item) => {
        if (!item) {
            throw new ApiError(400, "Email and Password are required");
        }
    });

    const user = await User.findOne({ email: email });

    if (!user) {
        throw new ApiError(401, "Authentication failed");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Authentication Failed");
    }

    const { accessToken, refreshToken } =
        await generateAccessTokenAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const cookieOptions = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("roktoShebaAccessToken", accessToken, cookieOptions)
        .json(new ApiResponse(200, accessToken, "User loggedin successfully"));
});

const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find().limit(10);
    if (!users)
        throw new ApiError(500, "Something went wrong while fetching users");

    res.status(200).json(new ApiResponse(200, users, "Users get successfully"));
});

const getUserDetails = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, "User not found with that Id");

    res.status(200).json(
        new ApiResponse(200, user, "User details found successfully")
    );
});

const updateUser = asyncHandler(async (req, res) => {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(201).json(
        new ApiResponse(201, updatedUser, "User updated successfully")
    );
});

const getUserProfile = asyncHandler(async (req, res) => {
    // req.user is set by verifyJWT middleware
    const user = await User.findById(req.user._id).select(
        "-password -refreshToken"
    );

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    res.status(200).json(
        new ApiResponse(200, user, "User profile fetched successfully")
    );
});

const getAdminProfile = asyncHandler(async (req, res) => {
    // req.user is set by verifyJWT middleware and should be an admin
    const admin = await User.findById(req.user._id).select(
        "-password -refreshToken"
    );

    if (!admin) {
        throw new ApiError(404, "Admin not found");
    }

    if (admin.role !== "admin") {
        throw new ApiError(403, "Access denied. Admin role required.");
    }

    // Update last login date
    admin.lastLoginDate = new Date();
    await admin.save({ validateBeforeSave: false });

    // Get fresh admin data with all address fields using aggregation
    const adminWithFullAddress = await User.aggregate([
        { $match: { _id: admin._id } },
        {
            $project: {
                // Include all fields except password and refreshToken
                name: 1,
                email: 1,
                profilePhoto: 1,
                bloodGroup: 1,
                role: 1,
                __v: 1,
                lastLoginDate: 1,
                // Explicitly include all address fields
                address: {
                    _id: "$address._id",
                    street: "$address.street",
                    city: "$address.city",
                    district: "$address.district",
                    division: "$address.division",
                    postalCode: "$address.postalCode",
                    addressLine: "$address.addressLine",
                    mobileNumber: "$address.mobileNumber",
                },
            },
        },
    ]);

    const adminData = adminWithFullAddress[0];

    res.status(200).json(
        new ApiResponse(200, adminData, "Admin profile fetched successfully")
    );
});

const updateAdminProfile = asyncHandler(async (req, res) => {
    const { name, email, address } = req.body;

    // Find admin user
    const admin = await User.findById(req.user._id);

    if (!admin) {
        throw new ApiError(404, "Admin not found");
    }

    if (admin.role !== "admin") {
        throw new ApiError(403, "Access denied. Admin role required.");
    }

    // Check if email is being updated and if it already exists
    if (email && email !== admin.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new ApiError(400, "Email already exists");
        }
    }

    // Check if mobile number is being updated and if it already exists
    let parsedAddress = null;
    if (address) {
        // Parse address if it's a string (from form data)
        parsedAddress =
            typeof address === "string" ? JSON.parse(address) : address;
    }

    if (
        parsedAddress?.mobileNumber &&
        parsedAddress.mobileNumber !== admin.address?.mobileNumber
    ) {
        const existingUser = await User.findOne({
            "address.mobileNumber": parsedAddress.mobileNumber,
        });
        if (existingUser) {
            throw new ApiError(400, "Mobile number already exists");
        }
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (parsedAddress) {
        // Support both old and new address format
        updateData.address = {
            street: parsedAddress.street || "",
            city: parsedAddress.city || "",
            district: parsedAddress.district || "",
            division: parsedAddress.division || "",
            postalCode: parsedAddress.postalCode || "",
            mobileNumber: parsedAddress.mobileNumber,
            // Keep addressLine for backward compatibility
            addressLine:
                parsedAddress.addressLine ||
                `${parsedAddress.street || ""}, ${parsedAddress.city || ""}, ${parsedAddress.district || ""}, ${parsedAddress.division || ""}`
                    .replace(/^,\s*|,\s*$/g, "")
                    .replace(/,\s*,/g, ","),
        };
    }
    updateData.updatedAt = new Date();

    // Handle profile photo upload
    if (
        req.file &&
        req.file.buffer &&
        req.file.mimetype &&
        req.file.originalname
    ) {
        // Get existing admin to check for old profile photo
        const existingAdmin = await User.findById(req.user._id).select(
            "profilePhoto"
        );
        const oldImageUrl = existingAdmin?.profilePhoto;

        const profilePhoto = await uploadBufferOnCloudinary(
            req.file.buffer,
            req.file.mimetype,
            req.file.originalname,
            "users/avatars",
            oldImageUrl
        );
        if (profilePhoto) {
            updateData.profilePhoto = profilePhoto.url;
        }
    }

    // Update admin profile
    const updatedAdmin = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateData },
        {
            new: true,
            runValidators: true,
        }
    ).select("-password -refreshToken");

    res.status(200).json(
        new ApiResponse(200, updatedAdmin, "Admin profile updated successfully")
    );
});

const changeAdminPassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
        throw new ApiError(400, "All password fields are required");
    }

    if (newPassword !== confirmPassword) {
        throw new ApiError(
            400,
            "New password and confirm password do not match"
        );
    }

    if (newPassword.length < 6) {
        throw new ApiError(
            400,
            "New password must be at least 6 characters long"
        );
    }

    // Find admin user
    const admin = await User.findById(req.user._id);

    if (!admin) {
        throw new ApiError(404, "Admin not found");
    }

    if (admin.role !== "admin") {
        throw new ApiError(403, "Access denied. Admin role required.");
    }

    // Verify current password
    const isPasswordCorrect = await admin.isPasswordCorrect(currentPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Current password is incorrect");
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.status(200).json(
        new ApiResponse(200, {}, "Password changed successfully")
    );
});

const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Delete profile photo from cloudinary if exists
    if (user.profilePhoto) {
        try {
            const publicId = getPublicIdFromUrl(user.profilePhoto);
            if (publicId) {
                await deleteFromCloudinary(publicId);
            }
        } catch (error) {
            console.log("Error deleting profile photo from cloudinary:", error);
            // Continue with deletion even if cloudinary fails
        }
    }

    // Delete user from database
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    res.status(200).json(
        new ApiResponse(200, deletedUser, "User deleted successfully")
    );
});

export {
    registerUser,
    getUsers,
    getUserDetails,
    updateUser,
    loginUser,
    getUserProfile,
    getAdminProfile,
    updateAdminProfile,
    changeAdminPassword,
    deleteUser,
};
