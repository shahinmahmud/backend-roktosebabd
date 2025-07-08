import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { TeamMember } from "../models/teamMember.model.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
    getPublicIdFromUrl,
} from "../utils/cloudinary.js";

// Get all team members (Public)
const getAllTeamMembers = asyncHandler(async (req, res) => {
    const teamMembers = await TeamMember.find({ isActive: true })
        .sort({ displayOrder: 1, createdAt: -1 })
        .select("-createdBy -updatedBy");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                teamMembers,
                "Team members retrieved successfully"
            )
        );
});

// Get all team members for admin (with all fields)
const getAllTeamMembersForAdmin = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = "" } = req.query;

    const query = {};
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: "i" } },
            { position: { $regex: search, $options: "i" } },
        ];
    }

    const teamMembers = await TeamMember.find(query)
        .sort({ displayOrder: 1, createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email");

    const total = await TeamMember.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                teamMembers,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total,
            },
            "Team members retrieved successfully"
        )
    );
});

// Get single team member
const getTeamMemberById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const teamMember = await TeamMember.findById(id)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email");

    if (!teamMember) {
        throw new ApiError(404, "Team member not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                teamMember,
                "Team member retrieved successfully"
            )
        );
});

// Create team member
const createTeamMember = asyncHandler(async (req, res) => {
    const { name, position, qualification, description, phone, displayOrder } =
        req.body;

    if (!name || !position || !description) {
        throw new ApiError(400, "নাম, পদবী এবং বিবরণ প্রয়োজনীয়");
    }

    let imageUrl = "";

    // Handle image upload
    if (req.file) {
        const cloudinaryResponse = await uploadOnCloudinary(
            req.file.path,
            "team-members"
        );
        if (cloudinaryResponse) {
            imageUrl = cloudinaryResponse.url;
        }
    }

    const teamMember = await TeamMember.create({
        name: name.trim(),
        position: position.trim(),
        qualification: qualification?.trim() || "",
        description: description.trim(),
        phone: phone?.trim() || "",
        image: imageUrl,
        displayOrder: displayOrder || 0,
        createdBy: req.user._id,
        updatedBy: req.user._id,
    });

    return res
        .status(201)
        .json(
            new ApiResponse(201, teamMember, "Team member created successfully")
        );
});

// Update team member
const updateTeamMember = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        name,
        position,
        qualification,
        description,
        phone,
        displayOrder,
        isActive,
    } = req.body;

    const teamMember = await TeamMember.findById(id);
    if (!teamMember) {
        throw new ApiError(404, "Team member not found");
    }

    let imageUrl = teamMember.image;

    // Handle new image upload
    if (req.file) {
        const oldImageUrl = teamMember.image;

        const cloudinaryResponse = await uploadOnCloudinary(
            req.file.path,
            "team-members",
            oldImageUrl
        );
        if (cloudinaryResponse) {
            imageUrl = cloudinaryResponse.url;
        }
    }

    // Update fields
    if (name) teamMember.name = name.trim();
    if (position) teamMember.position = position.trim();
    if (qualification !== undefined)
        teamMember.qualification = qualification.trim();
    if (description) teamMember.description = description.trim();
    if (phone !== undefined) teamMember.phone = phone.trim();
    if (displayOrder !== undefined) teamMember.displayOrder = displayOrder;
    if (isActive !== undefined) teamMember.isActive = isActive;

    teamMember.image = imageUrl;
    teamMember.updatedBy = req.user._id;

    await teamMember.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, teamMember, "Team member updated successfully")
        );
});

// Delete team member
const deleteTeamMember = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const teamMember = await TeamMember.findById(id);
    if (!teamMember) {
        throw new ApiError(404, "Team member not found");
    }

    // Delete image from cloudinary if exists
    if (teamMember.image) {
        try {
            const publicId = getPublicIdFromUrl(teamMember.image);
            if (publicId) {
                await deleteFromCloudinary(publicId);
            }
        } catch (error) {
            console.log("Error deleting image from cloudinary:", error);
            // Continue with deletion even if cloudinary fails
        }
    }

    await TeamMember.findByIdAndDelete(id);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Team member deleted successfully"));
});

// Update display order
const updateDisplayOrder = asyncHandler(async (req, res) => {
    const { teamMembers } = req.body; // Array of {id, displayOrder}

    if (!Array.isArray(teamMembers)) {
        throw new ApiError(400, "Invalid data format");
    }

    const updatePromises = teamMembers.map(({ id, displayOrder }) =>
        TeamMember.findByIdAndUpdate(
            id,
            { displayOrder, updatedBy: req.user._id },
            { new: true }
        )
    );

    await Promise.all(updatePromises);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Display order updated successfully"));
});

export {
    getAllTeamMembers,
    getAllTeamMembersForAdmin,
    getTeamMemberById,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
    updateDisplayOrder,
};
