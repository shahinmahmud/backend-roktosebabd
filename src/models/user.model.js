import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const addressSchema = new Schema({
    addressLine: {
        type: String,
    },
    street: {
        type: String,
    },
    city: {
        type: String,
    },
    district: {
        type: String,
    },
    division: {
        type: String,
    },
    postalCode: {
        type: String,
    },
    mobileNumber: {
        type: String,
        minLength: 11,
        maxLength: 14,
        required: true,
        unique: true,
    },
});

// Ensure all fields are included in JSON output
addressSchema.set("toJSON", {
    transform: function (doc, ret) {
        return {
            _id: ret._id,
            addressLine: ret.addressLine || "",
            street: ret.street || "",
            city: ret.city || "",
            district: ret.district || "",
            division: ret.division || "",
            postalCode: ret.postalCode || "",
            mobileNumber: ret.mobileNumber || "",
        };
    },
});

// Also ensure all fields are included when converting to object
addressSchema.set("toObject", {
    transform: function (doc, ret) {
        return {
            _id: ret._id,
            addressLine: ret.addressLine || "",
            street: ret.street || "",
            city: ret.city || "",
            district: ret.district || "",
            division: ret.division || "",
            postalCode: ret.postalCode || "",
            mobileNumber: ret.mobileNumber || "",
        };
    },
});

const userSchema = new Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
    },

    email: {
        type: String,
        unique: [true, "Email already exist"],
    },

    password: {
        type: String,
    },

    profilePhoto: {
        type: String,
    },

    address: addressSchema,

    bloodGroup: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
        required: [true, "Blood group is required"],
    },

    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

const User = new mongoose.model("User", userSchema);

export { User };
