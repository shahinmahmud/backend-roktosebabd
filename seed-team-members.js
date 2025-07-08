import mongoose from "mongoose";
import { TeamMember } from "./src/models/teamMember.model.js";
import dotenv from "dotenv";

dotenv.config();

const seedTeamMembers = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);

        // Clear existing team members
        await TeamMember.deleteMany({});

        // Default team members data
        const teamMembersData = [
            {
                name: "মোঃ শাহীন মাহমুদ",
                position: "প্রতিষ্ঠাতা ও চেয়ারম্যান",
                qualification: "",
                description: "সামাজিক কাজে ১০ বছরের অভিজ্ঞতা",
                phone: "01712345678",
                image: "",
                displayOrder: 1,
                isActive: true,
            },
            {
                name: "মোঃ রেজওয়ান খন্দকার",
                position: "মেডিকেল অ্যাডভাইজার",
                qualification: "Physiotherapist",
                description: "ফিজিওথেরাপিস্ট",
                phone: "01812345679",
                image: "",
                displayOrder: 2,
                isActive: true,
            },
            {
                name: "মোঃ শহীদ আলম",
                position: "উপদেষ্টা",
                qualification: "Honors in Business Administration",
                description: "সমাজকর্ম বিশেষজ্ঞ এবং স্বেচ্ছাসেবক দল পরিচালক।",
                phone: "01912345680",
                image: "",
                displayOrder: 3,
                isActive: true,
            },
            {
                name: "মো. রিফাত হোসেন",
                position: "ফার্মাসিস্ট",
                qualification: "Degree in Accounting",
                description: "সমাজসেবক এবং ফার্মাসিস্ট।",
                phone: "01612345681",
                image: "",
                displayOrder: 4,
                isActive: true,
            },
            {
                name: "মোঃ মেহেদী হাসান কাকন",
                position: "প্রযুক্তি পরিচালক ও উপদেষ্টা",
                qualification: "BSc in CSE, RUET",
                description:
                    "সফটওয়্যার ডেভেলপমেন্ট এবং সিস্টেম ডিজাইনে ৬ বছরের অভিজ্ঞতা।",
                phone: "01512345682",
                image: "",
                displayOrder: 5,
                isActive: true,
            },
            {
                name: "মোঃ মাসুদুর রহমান",
                position: "ডেভেলপার এবং ডিজাইনার",
                qualification: "BSc in CSE, NUB",
                description: "সফটওয়্যার ডেভেলপমেন্টে ৩ বছরের অভিজ্ঞতা।",
                phone: "01712345683",
                image: "",
                displayOrder: 6,
                isActive: true,
            },
        ];

        // Insert team members
        const insertedMembers = await TeamMember.insertMany(teamMembersData);

        // Success message
        console.log(
            `✅ Successfully seeded ${insertedMembers.length} team members:`
        );
        insertedMembers.forEach((member, index) => {
            console.log(`${index + 1}. ${member.name} - ${member.position}`);
        });
    } catch (error) {
        console.error("❌ Error seeding team members:", error);
    } finally {
        await mongoose.disconnect();
    }
};

seedTeamMembers();
