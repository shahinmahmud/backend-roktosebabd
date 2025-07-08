import mongoose from "mongoose";
import { Donor } from "./src/models/donor.model.js";
import dotenv from "dotenv";

dotenv.config();

const testMultipleNulls = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        console.log("🧪 Testing multiple donors with null values...\n");

        // Create multiple donors with null email and nationalId
        const donorsWithNulls = [];
        for (let i = 1; i <= 5; i++) {
            const donorData = {
                name: `মাল্টিপল টেস্ট ডোনার ${i}`,
                phone: `0180000000${i}`,
                city: "ঢাকা",
                location: "টেস্ট এলাকা",
                address: "টেস্ট ঠিকানা",
                bloodGroup: "O+",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1990-01-01"),
                password: "test123",
                // Intentionally not providing email and nationalId
                // They should default to null
            };

            try {
                const donor = await Donor.create(donorData);
                console.log(`✅ Created: ${donor.name} (${donor.donorId})`);
                console.log(
                    `   Email: ${donor.email === null ? "null" : donor.email}`
                );
                console.log(
                    `   National ID: ${donor.nationalId === null ? "null" : donor.nationalId}`
                );
                donorsWithNulls.push(donor);
            } catch (error) {
                console.log(`❌ Error creating donor ${i}: ${error.message}`);
            }
        }

        console.log(
            `\n🎉 Successfully created ${donorsWithNulls.length} donors with null values!`
        );

        // Clean up
        console.log("\n🧹 Cleaning up test data...");
        await Donor.deleteMany({ phone: { $regex: "^01800000" } });
        console.log("✅ Test data cleaned up");

        await mongoose.disconnect();
        console.log("🔐 Disconnected from MongoDB");
    } catch (error) {
        console.error("❌ Test error:", error);
    }
};

testMultipleNulls();
