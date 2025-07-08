import mongoose from "mongoose";
import { Donor } from "./src/models/donor.model.js";
import dotenv from "dotenv";

dotenv.config();

const seedDonors = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        // Clear existing donors (optional - comment out if you want to keep existing)
        // await Donor.deleteMany({});
        // console.log("🗑️ Cleared existing donors");

        // Test donor data with different scenarios
        const donorsData = [
            {
                name: "রাহুল আহমেদ",
                phone: "01712345678",
                city: "ঢাকা",
                location: "ধানমন্ডি",
                address: "বাড়ি ১৫, রোড ১২, ধানমন্ডি",
                bloodGroup: "A+",
                gender: "পুরুষ",
                religion: "ইসলাম",
                dateOfBirth: new Date("1995-05-15"),
                password: "password123",
                email: "rahul.ahmed@example.com",
                profession: "সফটওয়্যার ইঞ্জিনিয়ার",
                weight: 70,
                height: 5.8,
                totalDonations: 3,
                lastDonationDate: new Date("2024-08-15"), // 5 months ago - should be ELIGIBLE
                donationHistory: [
                    {
                        donationDate: new Date("2023-12-15"),
                        location: "ঢাকা মেডিকেল কলেজ",
                        bloodBank: "ঢাকা মেডিকেল",
                        units: 1,
                        notes: "প্রথম দান",
                    },
                    {
                        donationDate: new Date("2024-04-15"),
                        location: "শহীদ সোহরাওয়ার্দী মেডিকেল কলেজ",
                        bloodBank: "সোহরাওয়ার্দী হাসপাতাল",
                        units: 1,
                        notes: "দ্বিতীয় দান",
                    },
                    {
                        donationDate: new Date("2024-08-15"),
                        location: "বারডেম হাসপাতাল",
                        bloodBank: "বারডেম",
                        units: 1,
                        notes: "তৃতীয় দান",
                    },
                ],
            },
            {
                name: "সুমি খাতুন",
                phone: "01812345679",
                city: "চট্টগ্রাম",
                location: "আগ্রাবাদ",
                address: "বাড়ি ২৫, আগ্রাবাদ, চট্টগ্রাম",
                bloodGroup: "B+",
                gender: "মহিলা",
                religion: "ইসলাম",
                dateOfBirth: new Date("1992-08-20"),
                password: "password123",
                email: "sumi.khatun@example.com",
                profession: "শিক্ষক",
                weight: 55,
                height: 5.4,
                totalDonations: 1,
                lastDonationDate: new Date("2024-12-15"), // 20 days ago - should be INELIGIBLE
                donationHistory: [
                    {
                        donationDate: new Date("2024-12-15"),
                        location: "চট্টগ্রাম মেডিকেল কলেজ",
                        bloodBank: "চট্টগ্রাম মেডিকেল",
                        units: 1,
                        notes: "প্রথম দান",
                    },
                ],
            },
            {
                name: "কামাল হোসেন",
                phone: "01912345680",
                city: "সিলেট",
                location: "জিন্দাবাজার",
                address: "বাড়ি ৮, জিন্দাবাজার, সিলেট",
                bloodGroup: "O+",
                gender: "পুরুষ",
                religion: "ইসলাম",
                dateOfBirth: new Date("1988-12-10"),
                password: "password123",
                profession: "ব্যবসায়ী",
                weight: 75,
                height: 5.9,
                // No totalDonations or lastDonationDate - first time donor
            },
            {
                name: "রিনা বেগম",
                phone: "01612345681",
                city: "রাজশাহী",
                location: "সাহেব বাজার",
                address: "বাড়ি ৩৫, সাহেব বাজার, রাজশাহী",
                bloodGroup: "AB+",
                gender: "মহিলা",
                religion: "ইসলাম",
                dateOfBirth: new Date("1990-03-25"),
                password: "password123",
                email: "rina.begum@example.com",
                profession: "নার্স",
                weight: 60,
                height: 5.5,
                totalDonations: 5,
                lastDonationDate: new Date("2024-07-10"), // 6 months ago - should be ELIGIBLE
                donationHistory: [
                    {
                        donationDate: new Date("2023-03-10"),
                        location: "রাজশাহী মেডিকেল কলেজ",
                        bloodBank: "রাজশাহী মেডিকেল",
                        units: 1,
                        notes: "প্রথম দান",
                    },
                    {
                        donationDate: new Date("2023-07-15"),
                        location: "রাজশাহী মেডিকেল কলেজ",
                        bloodBank: "রাজশাহী মেডিকেল",
                        units: 1,
                        notes: "দ্বিতীয় দান",
                    },
                    {
                        donationDate: new Date("2023-11-20"),
                        location: "রাজশাহী মেডিকেল কলেজ",
                        bloodBank: "রাজশাহী মেডিকেল",
                        units: 1,
                        notes: "তৃতীয় দান",
                    },
                    {
                        donationDate: new Date("2024-03-25"),
                        location: "রাজশাহী মেডিকেল কলেজ",
                        bloodBank: "রাজশাহী মেডিকেল",
                        units: 1,
                        notes: "চতুর্থ দান",
                    },
                    {
                        donationDate: new Date("2024-07-10"),
                        location: "রাজশাহী মেডিকেল কলেজ",
                        bloodBank: "রাজশাহী মেডিকেল",
                        units: 1,
                        notes: "পঞ্চম দান",
                    },
                ],
            },
        ];

        console.log("🚀 Starting to create donors...");

        // Create donors one by one to see individual results
        const createdDonors = [];
        for (let i = 0; i < donorsData.length; i++) {
            try {
                const donorData = donorsData[i];
                console.log(`\n📝 Creating donor ${i + 1}: ${donorData.name}`);

                const donor = await Donor.create(donorData);
                createdDonors.push(donor);

                console.log(`✅ Created: ${donor.name}`);
                console.log(`   - Donor ID: ${donor.donorId}`);
                console.log(`   - Phone: ${donor.phone}`);
                console.log(`   - Blood Group: ${donor.bloodGroup}`);
                console.log(`   - Account Status: ${donor.accountStatus}`);
                console.log(
                    `   - Eligibility Status: ${donor.eligibilityStatus}`
                );
                console.log(`   - Total Donations: ${donor.totalDonations}`);
                console.log(
                    `   - Last Donation: ${donor.lastDonationDate ? donor.lastDonationDate.toDateString() : "Never"}`
                );
                console.log(
                    `   - Next Eligible: ${donor.nextEligibleDate ? donor.nextEligibleDate.toDateString() : "Now"}`
                );
            } catch (error) {
                console.error(
                    `❌ Error creating donor ${i + 1}:`,
                    error.message
                );
            }
        }

        console.log(
            `\n🎉 Successfully created ${createdDonors.length} donors out of ${donorsData.length}`
        );

        // Test search functionality
        console.log("\n🔍 Testing search functionality...");
        if (createdDonors.length > 0) {
            const testDonor = createdDonors[0];
            console.log(`\nSearching for donor with ID: ${testDonor.donorId}`);

            const foundDonor = await Donor.findOne({
                donorId: testDonor.donorId,
            });
            if (foundDonor) {
                console.log(
                    `✅ Found donor: ${foundDonor.name} (${foundDonor.donorId})`
                );
            } else {
                console.log(
                    `❌ Could not find donor with ID: ${testDonor.donorId}`
                );
            }
        }

        // Test eligibility check
        console.log("\n⏰ Testing eligibility calculations...");
        const allDonors = await Donor.find({});
        allDonors.forEach((donor) => {
            const eligibility = donor.checkDonationEligibility();
            console.log(
                `${donor.name} (${donor.donorId}): ${eligibility.isEligible ? "✅ ELIGIBLE" : "❌ INELIGIBLE"} - ${eligibility.message}`
            );
        });
    } catch (error) {
        console.error("❌ Error seeding donors:", error);
    } finally {
        await mongoose.disconnect();
        console.log("\n🔐 Disconnected from MongoDB");
    }
};

seedDonors();
