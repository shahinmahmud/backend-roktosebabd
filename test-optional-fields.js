import mongoose from "mongoose";
import { Donor } from "./src/models/donor.model.js";
import dotenv from "dotenv";

dotenv.config();

const testOptionalFields = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        // Test scenarios for optional fields
        const testCases = [
            {
                name: "Test Case 1: Email ছাড়া",
                donorData: {
                    name: "টেস্ট ডোনার ১",
                    phone: "01700000001",
                    city: "ঢাকা",
                    location: "টেস্ট এলাকা",
                    address: "টেস্ট ঠিকানা",
                    bloodGroup: "A+",
                    gender: "Male",
                    religion: "Islam",
                    dateOfBirth: new Date("1990-01-01"),
                    password: "test123",
                    // email field intentionally omitted
                },
            },
            {
                name: "Test Case 2: National ID ছাড়া",
                donorData: {
                    name: "টেস্ট ডোনার ২",
                    phone: "01700000002",
                    city: "ঢাকা",
                    location: "টেস্ট এলাকা",
                    address: "টেস্ট ঠিকানা",
                    bloodGroup: "B+",
                    gender: "Female",
                    religion: "Islam",
                    dateOfBirth: new Date("1992-01-01"),
                    password: "test123",
                    email: "test2@example.com",
                    // nationalId field intentionally omitted
                },
            },
            {
                name: "Test Case 3: Email = null",
                donorData: {
                    name: "টেস্ট ডোনার ৩",
                    phone: "01700000003",
                    city: "ঢাকা",
                    location: "টেস্ট এলাকা",
                    address: "টেস্ট ঠিকানা",
                    bloodGroup: "O+",
                    gender: "Male",
                    religion: "Islam",
                    dateOfBirth: new Date("1988-01-01"),
                    password: "test123",
                    email: null, // explicitly null
                },
            },
            {
                name: "Test Case 4: Email = empty string",
                donorData: {
                    name: "টেস্ট ডোনার ৪",
                    phone: "01700000004",
                    city: "ঢাকা",
                    location: "টেস্ট এলাকা",
                    address: "টেস্ট ঠিকানা",
                    bloodGroup: "AB+",
                    gender: "Female",
                    religion: "Islam",
                    dateOfBirth: new Date("1995-01-01"),
                    password: "test123",
                    email: "", // empty string
                },
            },
            {
                name: "Test Case 5: National ID = null",
                donorData: {
                    name: "টেস্ট ডোনার ৫",
                    phone: "01700000005",
                    city: "ঢাকা",
                    location: "টেস্ট এলাকা",
                    address: "টেস্ট ঠিকানা",
                    bloodGroup: "A-",
                    gender: "Male",
                    religion: "Islam",
                    dateOfBirth: new Date("1993-01-01"),
                    password: "test123",
                    email: "test5@example.com",
                    nationalId: null, // explicitly null
                },
            },
        ];

        console.log("🧪 Testing optional field scenarios...\n");

        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            try {
                console.log(`📝 ${testCase.name}`);
                const donor = await Donor.create(testCase.donorData);
                console.log(
                    `✅ Success: ${donor.name} created with ID ${donor.donorId}`
                );
                console.log(
                    `   Email: ${donor.email === null ? "null" : donor.email || "undefined"}`
                );
                console.log(
                    `   National ID: ${donor.nationalId === null ? "null" : donor.nationalId || "undefined"}`
                );
                console.log("");
            } catch (error) {
                console.log(`❌ Error: ${error.message}`);
                console.log("");
            }
        }

        // Clean up test data
        console.log("🧹 Cleaning up test data...");
        await Donor.deleteMany({ phone: { $regex: "^01700000" } });
        console.log("✅ Test data cleaned up");

        await mongoose.disconnect();
        console.log("🔐 Disconnected from MongoDB");
    } catch (error) {
        console.error("❌ Test error:", error);
    }
};

testOptionalFields();
