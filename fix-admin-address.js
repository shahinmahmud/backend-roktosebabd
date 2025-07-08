import mongoose from "mongoose";
import { User } from "./src/models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

const updateAdminAddress = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);

        // Find admin users
        const adminUsers = await User.find({ role: "admin" });

        for (const admin of adminUsers) {
            // Check if address exists and has mobileNumber
            if (!admin.address || !admin.address.mobileNumber) {
                // Create a default address structure
                admin.address = {
                    street: "রাস্তার ঠিকানা",
                    city: "ঢাকা",
                    district: "ঢাকা",
                    division: "ঢাকা",
                    postalCode: "1000",
                    mobileNumber: "01700000000", // Default mobile number
                    addressLine: "রাস্তার ঠিকানা, ঢাকা, ঢাকা, ঢাকা",
                };

                await admin.save();
            } else {
                // If address exists but missing individual fields, add them
                let updated = false;

                if (!admin.address.street) {
                    admin.address.street = "রাস্তার ঠিকানা";
                    updated = true;
                }
                if (!admin.address.city) {
                    admin.address.city = "ঢাকা";
                    updated = true;
                }
                if (!admin.address.district) {
                    admin.address.district = "ঢাকা";
                    updated = true;
                }
                if (!admin.address.division) {
                    admin.address.division = "ঢাকা";
                    updated = true;
                }
                if (!admin.address.postalCode) {
                    admin.address.postalCode = "1000";
                    updated = true;
                }

                if (updated) {
                    await admin.save();
                }
            }
        }
    } catch (error) {
        console.error("Error updating admin address:", error);
    } finally {
        await mongoose.disconnect();
    }
};

updateAdminAddress();
