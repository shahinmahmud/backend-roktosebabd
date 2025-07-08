import mongoose, { Schema } from "mongoose";

const teamMemberSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "নাম প্রয়োজনীয়"],
            trim: true,
        },
        position: {
            type: String,
            required: [true, "পদবী প্রয়োজনীয়"],
            trim: true,
        },
        qualification: {
            type: String,
            trim: true,
            default: "",
        },
        description: {
            type: String,
            required: [true, "বিবরণ প্রয়োজনীয়"],
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
            default: "",
            validate: {
                validator: function (v) {
                    // Allow empty or valid Bangladeshi phone numbers
                    return !v || /^(\+88)?01[3-9]\d{8}$/.test(v);
                },
                message: "অবৈধ ফোন নম্বর। বাংলাদেশী ফোন নম্বর ব্যবহার করুন।",
            },
        },
        image: {
            type: String,
            default: "",
        },
        displayOrder: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

// Index for better query performance
teamMemberSchema.index({ displayOrder: 1, isActive: 1 });
teamMemberSchema.index({ name: 1 });

// Transform the output
teamMemberSchema.set("toJSON", {
    transform: function (doc, ret) {
        delete ret.__v;
        return ret;
    },
});

export const TeamMember = mongoose.model("TeamMember", teamMemberSchema);
