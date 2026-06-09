import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const donorSchema = new Schema(
    {
        // Unique Donor ID (Auto-generated)
        donorId: {
            type: String,
            unique: true,
            sparse: true, // Allow null/undefined values during creation
        },

        // Basic Information (Required)
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            maxlength: [100, "Name cannot be more than 100 characters"],
        },

        phone: {
            type: String,
            required: [true, "Phone number is required"],
            unique: true,
            match: [
                /^(\+88)?01[3-9]\d{8}$/,
                "Please provide a valid Bangladeshi phone number",
            ],
        },

        city: {
            type: String,
            required: [true, "City is required"],
            trim: true,
        },

        location: {
            type: String,
            required: [true, "Location is required"],
            trim: true,
        },

        address: {
            type: String,
            required: [true, "Address is required"],
            trim: true,
        },

        bloodGroup: {
            type: String,
            enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
            required: [true, "Blood group is required"],
        },

        gender: {
            type: String,
            enum: ["Male", "Female", "Other"],
            required: [true, "Gender is required"],
        },

        religion: {
            type: String,
            enum: ["Islam", "Hinduism", "Buddhism", "Christianity", "Other"],
            required: [true, "Religion is required"],
        },

        dateOfBirth: {
            type: Date,
            required: [true, "Date of birth is required"],
            validate: {
                validator: function (value) {
                    const age = Math.floor(
                        (Date.now() - value.getTime()) /
                            (365.25 * 24 * 60 * 60 * 1000)
                    );
                    return age >= 18 && age <= 65;
                },
                message: "Donor must be between 18 and 65 years old",
            },
        },

        totalDonations: {
            type: Number,
            default: 0,
            min: [0, "Total donations cannot be negative"],
        },

        // Optional Initial Donation Information
        initialTotalDonations: {
            type: Number,
            default: 0,
            min: [0, "Initial total donations cannot be negative"],
        },

        initialLastDonationDate: {
            type: Date,
            default: null,
        },

        // Authentication (Required)
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters long"],
        },

        // Optional Information
        email: {
            type: String,
            unique: true,
            sparse: true, // allows multiple null values
            default: null,
            validate: {
                validator: function (value) {
                    // Allow null, undefined, or valid email format
                    if (!value || value.trim() === "") return true;
                    return /^\S+@\S+\.\S+$/.test(value);
                },
                message: "Please provide a valid email address",
            },
            lowercase: true,
            trim: true,
            set: function (value) {
                // Convert empty string to null to avoid duplicate key issues
                return !value || value.trim() === ""
                    ? null
                    : value.toLowerCase().trim();
            },
        },

        profession: {
            type: String,
            trim: true,
            maxlength: [100, "Profession cannot be more than 100 characters"],
        },

        weight: {
            type: Number,
            min: [50, "Weight must be at least 50 kg for blood donation"],
            max: [200, "Weight seems invalid"],
        },

        height: {
            type: Number,
            min: [120, "Height seems invalid"],
            max: [250, "Height seems invalid"],
        },

        nationalId: {
            type: String,
            unique: true,
            sparse: true,
            default: null,
            validate: {
                validator: function (value) {
                    // Allow null, undefined, or valid NID format
                    if (!value || value.trim() === "") return true;
                    return /^\d{10}$|^\d{13}$|^\d{17}$/.test(value);
                },
                message:
                    "Please provide a valid National ID (10, 13, or 17 digits)",
            },
            set: function (value) {
                // Convert empty string to null to avoid duplicate key issues
                return !value || value.trim() === "" ? null : value.trim();
            },
        },

        profilePhoto: {
            type: String, // Cloudinary URL
        },

        // Medical Information
        lastDonationDate: {
            type: Date,
            default: null,
        },

        nextEligibleDate: {
            type: Date,
            default: null,
        },

        medicalConditions: [
            {
                condition: String,
                description: String,
                diagnosedDate: Date,
            },
        ],

        currentMedications: [
            {
                medication: String,
                dosage: String,
                frequency: String,
            },
        ],

        // Emergency Contact
        emergencyContact: {
            name: {
                type: String,
                trim: true,
            },
            phone: {
                type: String,
                match: [
                    /^(\+88)?01[3-9]\d{8}$/,
                    "Please provide a valid phone number",
                ],
            },
            relation: {
                type: String,
                trim: true,
            },
        },

        // Account Management
        accountStatus: {
            type: String,
            enum: ["PENDING", "ACTIVE", "SUSPENDED", "INACTIVE"],
            default: "ACTIVE",
        },

        eligibilityStatus: {
            type: String,
            enum: [
                "PENDING",
                "ELIGIBLE",
                "TEMPORARILY_INELIGIBLE",
                "PERMANENTLY_INELIGIBLE",
            ],
            default: "ELIGIBLE",
        },

        registrationDate: {
            type: Date,
            default: Date.now,
        },

        lastLoginDate: {
            type: Date,
            default: null,
        },

        emailVerified: {
            type: Boolean,
            default: false,
        },

        phoneVerified: {
            type: Boolean,
            default: false,
        },

        // Donation History
        donationHistory: [
            {
                donationDate: {
                    type: Date,
                    required: true,
                },
                location: String,
                bloodBank: String,
                units: {
                    type: Number,
                    default: 1,
                },
                notes: String,
            },
        ],

        // Privacy Settings
        privacySettings: {
            showPhoneToPublic: {
                type: Boolean,
                default: true,
            },
            showEmailToPublic: {
                type: Boolean,
                default: false,
            },
            allowEmergencyContact: {
                type: Boolean,
                default: true,
            },
        },

        // JWT Refresh Token
        refreshToken: {
            type: String,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt automatically
    }
);

// Pre-save middleware for password hashing and donor ID generation
donorSchema.pre("save", async function (next) {
    try {
        // Hash password if modified
        if (this.isModified("password")) {
            this.password = await bcrypt.hash(this.password, 10);
        }

        // Generate donor ID if not exists
        if (!this.donorId) {
            this.donorId = await this.constructor.generateDonorId();
        }

        // Set initial values if provided during registration
        if (this.isNew) {
            if (this.initialTotalDonations && this.initialTotalDonations > 0) {
                this.totalDonations = this.initialTotalDonations;
            }

            if (this.initialLastDonationDate) {
                this.lastDonationDate = this.initialLastDonationDate;

                // Add to donation history
                this.donationHistory.push({
                    donationDate: this.initialLastDonationDate,
                    location: "Previous Donation",
                    bloodBank: "Previous Donation",
                    units: 1,
                    notes: "Initial donation record from registration",
                });

                // Calculate eligibility based on last donation date
                const daysSinceLastDonation = Math.floor(
                    (Date.now() - this.lastDonationDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                );

                if (daysSinceLastDonation >= 120) {
                    this.eligibilityStatus = "ELIGIBLE";
                    this.nextEligibleDate = null;
                } else {
                    this.eligibilityStatus = "INELIGIBLE";
                    this.nextEligibleDate = new Date(
                        this.lastDonationDate.getTime() +
                            120 * 24 * 60 * 60 * 1000
                    );
                }
            }
        }

        next();
    } catch (error) {
        next(error);
    }
});

// Generate unique donor ID
donorSchema.statics.generateDonorId = async function () {
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, "0");
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const year = String(currentDate.getFullYear()).slice(-2);

    const datePrefix = `D${day}${month}${year}`;

    // Find the last donor ID with today's date
    const lastDonor = await this.findOne(
        { donorId: { $regex: `^${datePrefix}` } },
        {},
        { sort: { donorId: -1 } }
    );

    let sequence = "01";
    if (lastDonor) {
        const lastSequence = parseInt(lastDonor.donorId.slice(-2));
        sequence = String(lastSequence + 1).padStart(2, "0");
    }

    return `${datePrefix}${sequence}`;
};

// Compare password method
donorSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Generate Access Token
donorSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            phone: this.phone,
            name: this.name,
            role: "DONOR",
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

// Generate Refresh Token
donorSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            role: "DONOR",
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

// Calculate age
donorSchema.methods.getAge = function () {
    return Math.floor(
        (Date.now() - this.dateOfBirth.getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
    );
};

// Check donation eligibility with auto-update
donorSchema.methods.checkDonationEligibility = function () {
    const age = this.getAge();

    // Basic age check
    if (age < 18 || age > 65) {
        this.eligibilityStatus = "PERMANENTLY_INELIGIBLE";
        return {
            eligible: false,
            reason: "Age not within eligible range (18-65)",
        };
    }

    // Weight check
    if (this.weight && this.weight < 50) {
        this.eligibilityStatus = "TEMPORARILY_INELIGIBLE";
        return {
            eligible: false,
            reason: "Weight below minimum requirement (50kg)",
        };
    }

    // Last donation date check (minimum 120 days gap)
    const lastDonationDate =
        this.lastDonationDate || this.initialLastDonationDate;
    if (lastDonationDate) {
        const daysSinceLastDonation = Math.floor(
            (Date.now() - lastDonationDate.getTime()) / (24 * 60 * 60 * 1000)
        );

        if (daysSinceLastDonation < 120) {
            this.eligibilityStatus = "TEMPORARILY_INELIGIBLE";
            const nextEligibleDate = new Date(
                lastDonationDate.getTime() + 120 * 24 * 60 * 60 * 1000
            );
            this.nextEligibleDate = nextEligibleDate;
            return {
                eligible: false,
                reason: `Must wait 120 days between donations. Next eligible: ${nextEligibleDate.toDateString()}`,
                nextEligibleDate,
            };
        } else {
            this.eligibilityStatus = "ELIGIBLE";
        }
    }

    // Account status check
    if (this.accountStatus !== "ACTIVE") {
        return { eligible: false, reason: "Account not active" };
    }

    if (this.eligibilityStatus === "PERMANENTLY_INELIGIBLE") {
        return { eligible: false, reason: "Permanently ineligible" };
    }

    if (this.eligibilityStatus === "TEMPORARILY_INELIGIBLE") {
        return { eligible: false, reason: "Temporarily ineligible" };
    }

    // If all checks pass, ensure eligible status
    this.eligibilityStatus = "ELIGIBLE";
    return { eligible: true, reason: "Eligible for donation" };
};

// Update next eligible date
donorSchema.methods.updateNextEligibleDate = function () {
    if (this.lastDonationDate) {
        this.nextEligibleDate = new Date(
            this.lastDonationDate.getTime() + 120 * 24 * 60 * 60 * 1000
        );
    }
};

// Add donation record with auto eligibility check
donorSchema.methods.addDonation = function (donationData) {
    this.donationHistory.push(donationData);
    this.totalDonations += 1;
    this.lastDonationDate = donationData.donationDate;
    this.updateNextEligibleDate();

    // Auto-update eligibility status
    this.checkDonationEligibility();
};

// Initialize donor with initial donation data
donorSchema.methods.initializeWithDonationData = function () {
    if (this.initialTotalDonations > 0) {
        this.totalDonations = this.initialTotalDonations;
    }

    if (this.initialLastDonationDate) {
        this.lastDonationDate = this.initialLastDonationDate;

        // Add initial donation to history
        this.donationHistory.push({
            donationDate: this.initialLastDonationDate,
            location: "Initial Registration Data",
            bloodBank: "Previous Donation",
            units: 1,
            notes: "Donation data provided during registration",
        });

        this.updateNextEligibleDate();
    }

    // Check and update eligibility
    this.checkDonationEligibility();
};

// Create indexes for better performance
donorSchema.index({ donorId: 1 });
donorSchema.index({ phone: 1 });
donorSchema.index({ email: 1 });
donorSchema.index({ nationalId: 1 });
donorSchema.index({ bloodGroup: 1 });
donorSchema.index({ city: 1 });
donorSchema.index({ accountStatus: 1 });
donorSchema.index({ eligibilityStatus: 1 });
donorSchema.index({ createdAt: -1 });

const Donor = mongoose.model("Donor", donorSchema);

export { Donor };
