import mongoose from "mongoose";
import { Donor } from "./src/models/donor.model.js";
import dotenv from "dotenv";

dotenv.config();

const checkNullEmails = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const nullEmailCount = await Donor.countDocuments({ email: null });
        const emptyEmailCount = await Donor.countDocuments({ email: "" });
        const missingEmailCount = await Donor.countDocuments({
            email: { $exists: false },
        });
        const totalDonors = await Donor.countDocuments({});

        console.log("Email statistics:");
        console.log("Donors with email: null ->", nullEmailCount);
        console.log("Donors with email: empty string ->", emptyEmailCount);
        console.log("Donors without email field ->", missingEmailCount);
        console.log("Total donors ->", totalDonors);

        // Check for exact duplicates
        const sampleNullDonors = await Donor.find({ email: null })
            .limit(5)
            .select("name phone email");
        console.log("\nSample donors with null email:");
        sampleNullDonors.forEach((donor) => {
            console.log(
                `- ${donor.name} (${donor.phone}) email: ${donor.email}`
            );
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
};

checkNullEmails();
