import mongoose from "mongoose";
import { Donor } from "./src/models/donor.model.js";
import dotenv from "dotenv";

dotenv.config();

const seedDonors = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        // Clear existing test donors (optional - comment out if you want to keep existing)
        await Donor.deleteMany({
            phone: {
                $regex: "^017[0-9]{8}$|^018[0-9]{8}$|^019[0-9]{8}$|^016[0-9]{8}$|^015[0-9]{8}$|^013[0-9]{8}$|^014[0-9]{8}$",
            },
        });
        console.log("🗑️ Cleared existing test donors");

        // Drop problematic indexes if they exist
        try {
            await Donor.collection.dropIndex("nationalId_1");
            console.log("🗑️ Dropped nationalId index");
        } catch (error) {
            console.log("ℹ️ nationalId index not found or already dropped");
        }

        try {
            await Donor.collection.dropIndex("email_1");
            console.log("🗑️ Dropped email index");
        } catch (error) {
            console.log("ℹ️ email index not found or already dropped");
        }

        // Remove all email fields from existing documents to clean slate
        try {
            await Donor.updateMany({}, { $unset: { email: "" } });
            console.log("🧹 Cleaned existing email fields");
        } catch (error) {
            console.log("⚠️ Could not clean email fields:", error.message);
        }

        // Recreate email index as sparse to allow multiple null values
        try {
            await Donor.collection.createIndex(
                { email: 1 },
                { unique: true, sparse: true }
            );
            console.log("✅ Created sparse email index");
        } catch (error) {
            console.log("⚠️ Could not create email index:", error.message);
        }

        // Test donor data with different scenarios
        const donorsData = [
            {
                name: "রাহুল আহমেদ",
                phone: "01712345678",
                city: "ঢাকা",
                location: "ধানমন্ডি",
                address: "বাড়ি ১৫, রোড ১২, ধানমন্ডি",
                bloodGroup: "A+",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1995-05-15"),
                password: "password123",
                email: "rahul.ahmed@example.com",
                profession: "সফটওয়্যার ইঞ্জিনিয়ার",
                weight: 70,
                height: 175, // in cm
                initialTotalDonations: 3,
                initialLastDonationDate: new Date("2024-08-15"), // 5 months ago - should be ELIGIBLE
            },
            {
                name: "সুমি খাতুন",
                phone: "01812345679",
                city: "চট্টগ্রাম",
                location: "আগ্রাবাদ",
                address: "বাড়ি ২৫, আগ্রাবাদ, চট্টগ্রাম",
                bloodGroup: "B+",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1992-08-20"),
                password: "password123",
                email: "sumi.khatun@example.com",
                profession: "শিক্ষক",
                weight: 55,
                height: 165, // in cm
                initialTotalDonations: 1,
                initialLastDonationDate: new Date("2024-12-15"), // 20 days ago - should be INELIGIBLE
            },
            {
                name: "কামাল হোসেন",
                phone: "01912345680",
                city: "সিলেট",
                location: "জিন্দাবাজার",
                address: "বাড়ি ৮, জিন্দাবাজার, সিলেট",
                bloodGroup: "O+",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1988-12-10"),
                password: "password123",
                profession: "ব্যবসায়ী",
                email: null, // Explicitly set to null
                weight: 75,
                height: 180, // in cm
                // No initialTotalDonations or initialLastDonationDate - first time donor
            },
            {
                name: "রিনা বেগম",
                phone: "01612345681",
                city: "রাজশাহী",
                location: "সাহেব বাজার",
                address: "বাড়ি ৩৫, সাহেব বাজার, রাজশাহী",
                bloodGroup: "AB+",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1990-03-25"),
                password: "password123",
                email: "rina.begum@example.com",
                profession: "নার্স",
                weight: 60,
                height: 168, // in cm
                initialTotalDonations: 5,
                initialLastDonationDate: new Date("2024-07-10"), // 6 months ago - should be ELIGIBLE
            },
            // Additional 50 diverse donors for robust testing
            {
                name: "আবদুল কাদের",
                phone: "01712345682",
                city: "ঢাকা",
                location: "মিরপুর",
                address: "বাড়ি ২১০, মিরপুর ১০, ঢাকা",
                bloodGroup: "A-",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1985-02-12"),
                password: "password123",
                email: "abdul.kader@example.com",
                profession: "ডাক্তার",
                weight: 72,
                height: 178,
                initialTotalDonations: 8,
                initialLastDonationDate: new Date("2024-06-20"), // 7 months ago - ELIGIBLE
            },
            {
                name: "ফাতেমা খাতুন",
                phone: "01812345683",
                city: "চট্টগ্রাম",
                location: "কালুরঘাট",
                address: "বাড়ি ১২৮, কালুরঘাট, চট্টগ্রাম",
                bloodGroup: "B-",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1993-07-08"),
                password: "password123",
                email: "fatema.khatun@example.com",
                profession: "ব্যাংক কর্মকর্তা",
                weight: 58,
                height: 162,
                initialTotalDonations: 2,
                initialLastDonationDate: new Date("2024-11-20"), // 1.5 months ago - INELIGIBLE
            },
            {
                name: "মোহাম্মদ রফিক",
                phone: "01912345684",
                city: "সিলেট",
                location: "কাজীটুলা",
                address: "বাড়ি ৪৫, কাজীটুলা, সিলেট",
                bloodGroup: "O-",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1987-11-30"),
                password: "password123",
                profession: "ইলেকট্রিশিয়ান",
                weight: 68,
                height: 170,
                // No email field - omit it entirely
                // First time donor
            },
            {
                name: "নুরজাহান আক্তার",
                phone: "01612345685",
                city: "রাজশাহী",
                location: "কাজলা",
                address: "বাড়ি ৭৮, কাজলা, রাজশাহী",
                bloodGroup: "AB-",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1991-04-18"),
                password: "password123",
                email: "nurjahan.akter@example.com",
                profession: "সরকারি কর্মচারী",
                weight: 62,
                height: 165,
                initialTotalDonations: 4,
                initialLastDonationDate: new Date("2024-05-25"), // 8 months ago - ELIGIBLE
            },
            {
                name: "আল আমিন",
                phone: "01512345686",
                city: "বরিশাল",
                location: "নাথুল্লাবাদ",
                address: "বাড়ি ৯৫, নাথুল্লাবাদ, বরিশাল",
                bloodGroup: "A+",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1989-09-22"),
                password: "password123",
                profession: "কৃষক",
                weight: 65,
                height: 172,
                email: null, // Explicitly set to null
                initialTotalDonations: 1,
                initialLastDonationDate: new Date("2024-12-01"), // 1 month ago - INELIGIBLE
            },
            {
                name: "সালমা বেগম",
                phone: "01312345687",
                city: "খুলনা",
                location: "দৌলতপুর",
                address: "বাড়ি ৩৬, দৌলতপুর, খুলনা",
                bloodGroup: "B+",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1994-01-14"),
                password: "password123",
                email: "salma.begum@example.com",
                profession: "গৃহিণী",
                weight: 56,
                height: 160,
                initialTotalDonations: 6,
                initialLastDonationDate: new Date("2024-04-10"), // 9 months ago - ELIGIBLE
            },
            {
                name: "জাহিদ হাসান",
                phone: "01412345688",
                city: "রংপুর",
                location: "মহিগঞ্জ",
                address: "বাড়ি ১৫৫, মহিগঞ্জ, রংপুর",
                bloodGroup: "O+",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1986-06-03"),
                password: "password123",
                profession: "চালক",
                weight: 74,
                height: 176,
                email: null, // Explicitly set to null
                // First time donor
            },
            {
                name: "রোকেয়া খাতুন",
                phone: "01712345689",
                city: "ঢাকা",
                location: "উত্তরা",
                address: "বাড়ি ৮৮, সেক্টর ৭, উত্তরা",
                bloodGroup: "AB+",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1992-12-25"),
                password: "password123",
                email: "rokeya.khatun@example.com",
                profession: "ফার্মাসিস্ট",
                weight: 59,
                height: 163,
                initialTotalDonations: 3,
                initialLastDonationDate: new Date("2024-08-05"), // 5.5 months ago - ELIGIBLE
            },
            {
                name: "মাহবুব আলম",
                phone: "01812345690",
                city: "চট্টগ্রাম",
                location: "হালিশহর",
                address: "বাড়ি ৬৭, হালিশহর, চট্টগ্রাম",
                bloodGroup: "A-",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1984-08-17"),
                password: "password123",
                profession: "পুলিশ",
                email: null, // Explicitly set to null
                weight: 78,
                height: 182,
                initialTotalDonations: 12,
                initialLastDonationDate: new Date("2024-10-15"), // 2.5 months ago - INELIGIBLE
            },
            {
                name: "নাসরিন সুলতানা",
                phone: "01912345691",
                city: "সিলেট",
                location: "আম্বরখানা",
                address: "বাড়ি ২৩৪, আম্বরখানা, সিলেট",
                bloodGroup: "B-",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1990-05-11"),
                password: "password123",
                email: "nasrin.sultana@example.com",
                profession: "কম্পিউটার অপারেটর",
                weight: 54,
                height: 158,
                initialTotalDonations: 2,
                initialLastDonationDate: new Date("2024-03-20"), // 10 months ago - ELIGIBLE
            },
            {
                name: "তানভীর আহমেদ",
                phone: "01612345692",
                city: "রাজশাহী",
                location: "বরেন্দ্র",
                address: "বাড়ি ১১২, বরেন্দ্র, রাজশাহী",
                bloodGroup: "O-",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1988-03-07"),
                password: "password123",
                profession: "মেকানিক",
                email: null, // Explicitly set to null
                weight: 71,
                height: 174,
                // First time donor
            },
            {
                name: "শামীমা পারভীন",
                phone: "01512345693",
                city: "বরিশাল",
                location: "কেরানিগঞ্জ",
                address: "বাড়ি ৫৬, কেরানিগঞ্জ, বরিশাল",
                bloodGroup: "AB-",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1993-10-14"),
                password: "password123",
                email: "shamima.parvin@example.com",
                profession: "টেইলর",
                weight: 57,
                height: 161,
                initialTotalDonations: 1,
                initialLastDonationDate: new Date("2024-07-30"), // 5 months ago - ELIGIBLE
            },
            {
                name: "আবুল হাসেম",
                phone: "01312345694",
                city: "খুলনা",
                location: "খালিশপুর",
                address: "বাড়ি ১৯৮, খালিশপুর, খুলনা",
                bloodGroup: "A+",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1985-12-02"),
                password: "password123",
                profession: "শিপ ইঞ্জিনিয়ার",
                email: null, // Explicitly set to null
                weight: 76,
                height: 179,
                initialTotalDonations: 15,
                initialLastDonationDate: new Date("2024-11-10"), // 2 months ago - INELIGIBLE
            },
            {
                name: "রাবেয়া খাতুন",
                phone: "01412345695",
                city: "রংপুর",
                location: "কারমাইকেল",
                address: "বাড়ি ৭৭, কারমাইকেল, রংপুর",
                bloodGroup: "B+",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1991-07-20"),
                password: "password123",
                profession: "নার্স",
                email: null, // Explicitly set to null
                weight: 61,
                height: 166,
                initialTotalDonations: 7,
                initialLastDonationDate: new Date("2024-02-14"), // 11 months ago - ELIGIBLE
            },
            {
                name: "সাইফুল ইসলাম",
                phone: "01712345696",
                city: "ঢাকা",
                location: "গুলশান",
                address: "বাড়ি ৪৫, গুলশান ২, ঢাকা",
                bloodGroup: "O+",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1987-04-28"),
                password: "password123",
                email: "saiful.islam@example.com",
                profession: "সিভিল ইঞ্জিনিয়ার",
                weight: 73,
                height: 177,
                // First time donor
            },
            {
                name: "মরিয়ম আক্তার",
                phone: "01812345697",
                city: "চট্টগ্রাম",
                location: "পাহাড়তলী",
                address: "বাড়ি ১৬৭, পাহাড়তলী, চট্টগ্রাম",
                bloodGroup: "AB+",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1994-11-09"),
                password: "password123",
                email: "moriam.akter@example.com",
                profession: "গ্রাফিক ডিজাইনার",
                weight: 52,
                height: 159,
                initialTotalDonations: 4,
                initialLastDonationDate: new Date("2024-12-20"), // 2 weeks ago - INELIGIBLE
            },
            {
                name: "হাফিজুর রহমান",
                phone: "01912345698",
                city: "সিলেট",
                location: "তুলতিকর",
                address: "বাড়ি ৩১, তুলতিকর, সিলেট",
                bloodGroup: "A-",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1989-01-16"),
                password: "password123",
                profession: "হোটেল ম্যানেজার",
                email: null, // Explicitly set to null
                weight: 69,
                height: 171,
                initialTotalDonations: 9,
                initialLastDonationDate: new Date("2024-06-05"), // 7.5 months ago - ELIGIBLE
            },
            {
                name: "সুফিয়া বেগম",
                phone: "01612345699",
                city: "রাজশাহী",
                location: "শাহেব বাজার",
                address: "বাড়ি ২০১, শাহেব বাজার, রাজশাহী",
                bloodGroup: "B-",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1992-06-13"),
                password: "password123",
                email: "sufia.begum@example.com",
                profession: "অ্যাকাউন্টেন্ট",
                weight: 60,
                height: 164,
                initialTotalDonations: 3,
                initialLastDonationDate: new Date("2024-09-10"), // 4 months ago - ELIGIBLE
            },
            {
                name: "আজিজুর রহমান",
                phone: "01512345700",
                city: "বরিশাল",
                location: "চকবাজার",
                address: "বাড়ি ৮৯, চকবাজার, বরিশাল",
                bloodGroup: "O-",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1986-09-05"),
                password: "password123",
                profession: "মৎস্যজীবী",
                email: null, // Explicitly set to null
                weight: 67,
                height: 169,
                // First time donor
            },
            {
                name: "জেসমিন আক্তার",
                phone: "01312345701",
                city: "খুলনা",
                location: "তুতপাড়া",
                address: "বাড়ি ১৪৩, তুতপাড়া, খুলনা",
                bloodGroup: "AB-",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1995-02-28"),
                password: "password123",
                email: "jesmin.akter@example.com",
                profession: "ল্যাব টেকনিশিয়ান",
                weight: 55,
                height: 162,
                initialTotalDonations: 2,
                initialLastDonationDate: new Date("2024-05-15"), // 8.5 months ago - ELIGIBLE
            },
            {
                name: "ইমরান হোসেন",
                phone: "01412345702",
                city: "রংপুর",
                location: "ঘাঘট",
                address: "বাড়ি ৬৪, ঘাঘট, রংপুর",
                bloodGroup: "A+",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1983-11-12"),
                password: "password123",
                profession: "রিকশা চালক",
                email: null, // Explicitly set to null
                weight: 64,
                height: 168,
                initialTotalDonations: 5,
                initialLastDonationDate: new Date("2024-10-25"), // 2 months ago - INELIGIBLE
            },
            {
                name: "শিরিন আক্তার",
                phone: "01712345703",
                city: "ঢাকা",
                location: "বনানী",
                address: "বাড়ি ৭২, বনানী, ঢাকা",
                bloodGroup: "B+",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1990-08-07"),
                password: "password123",
                email: "shirin.akter@example.com",
                profession: "ইউনিভার্সিটি লেকচারার",
                weight: 58,
                height: 165,
                initialTotalDonations: 8,
                initialLastDonationDate: new Date("2024-01-20"), // 12 months ago - ELIGIBLE
            },
            {
                name: "মিজানুর রহমান",
                phone: "01812345704",
                city: "চট্টগ্রাম",
                location: "চান্দগাঁও",
                address: "বাড়ি ১১৮, চান্দগাঁও, চট্টগ্রাম",
                bloodGroup: "O+",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1988-12-04"),
                password: "password123",
                profession: "শিপিং এজেন্ট",
                email: null, // Explicitly set to null
                weight: 75,
                height: 180,
                // First time donor
            },
            {
                name: "নাজমা খাতুন",
                phone: "01912345705",
                city: "সিলেট",
                location: "মিরাবাজার",
                address: "বাড়ি ৯৫, মিরাবাজার, সিলেট",
                bloodGroup: "AB+",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1993-04-21"),
                password: "password123",
                email: "nazma.khatun@example.com",
                profession: "মাইক্রো ক্রেডিট অফিসার",
                weight: 56,
                height: 160,
                initialTotalDonations: 6,
                initialLastDonationDate: new Date("2024-11-30"), // 1 month ago - INELIGIBLE
            },
            {
                name: "শাকিল আহমেদ",
                phone: "01612345706",
                city: "রাজশাহী",
                location: "কাশিয়াডাঙ্গা",
                address: "বাড়ি ৩৭, কাশিয়াডাঙ্গা, রাজশাহী",
                bloodGroup: "A-",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1985-07-15"),
                password: "password123",
                profession: "আইটি সাপোর্ট",
                email: null, // Explicitly set to null
                weight: 70,
                height: 175,
                initialTotalDonations: 11,
                initialLastDonationDate: new Date("2024-04-25"), // 8.5 months ago - ELIGIBLE
            },
            {
                name: "রুবিনা আক্তার",
                phone: "01512345707",
                city: "বরিশাল",
                location: "আলেকান্দা",
                address: "বাড়ি ১৫২, আলেকান্দা, বরিশাল",
                bloodGroup: "B-",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1991-10-03"),
                password: "password123",
                email: "rubina.akter@example.com",
                profession: "সেলস এক্সিকিউটিভ",
                weight: 53,
                height: 157,
                initialTotalDonations: 4,
                initialLastDonationDate: new Date("2024-08-20"), // 4.5 months ago - ELIGIBLE
            },
            {
                name: "নুরুল আমিন",
                phone: "01312345708",
                city: "খুলনা",
                location: "লবণচরা",
                address: "বাড়ি ৮৮, লবণচরা, খুলনা",
                bloodGroup: "O-",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1987-01-29"),
                password: "password123",
                profession: "ইলেকট্রনিক্স টেকনিশিয়ান",
                email: null, // Explicitly set to null
                weight: 68,
                height: 172,
                // First time donor
            },
            {
                name: "সাবিনা ইয়াসমিন",
                phone: "01412345709",
                city: "রংপুর",
                location: "ডিমলা",
                address: "বাড়ি ২৬, ডিমলা, রংপুর",
                bloodGroup: "AB-",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1994-03-18"),
                password: "password123",
                email: "sabina.yasmin@example.com",
                profession: "সামাজিক কর্মী",
                weight: 59,
                height: 163,
                initialTotalDonations: 3,
                initialLastDonationDate: new Date("2024-07-05"), // 6 months ago - ELIGIBLE
            },
            {
                name: "কবির হোসেন",
                phone: "01712345710",
                city: "ঢাকা",
                location: "রমনা",
                address: "বাড়ি ১৯, রমনা, ঢাকা",
                bloodGroup: "A+",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1982-05-06"),
                password: "password123",
                profession: "সিকিউরিটি গার্ড",
                email: null, // Explicitly set to null
                weight: 66,
                height: 170,
                initialTotalDonations: 18,
                initialLastDonationDate: new Date("2024-12-05"), // 1 month ago - INELIGIBLE
            },
            {
                name: "তাহমিনা খাতুন",
                phone: "01812345711",
                city: "চট্টগ্রাম",
                location: "বায়েজিদ",
                address: "বাড়ি ৪৪, বায়েজিদ, চট্টগ্রাম",
                bloodGroup: "B+",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1989-09-12"),
                password: "password123",
                email: "tahmina.khatun@example.com",
                profession: "স্কুল শিক্ষিকা",
                weight: 57,
                height: 161,
                initialTotalDonations: 2,
                initialLastDonationDate: new Date("2024-03-10"), // 10 months ago - ELIGIBLE
            },
            {
                name: "আরিফুল ইসলাম",
                phone: "01912345712",
                city: "সিলেট",
                location: "বন্দরবাজার",
                address: "বাড়ি ৭৬, বন্দরবাজার, সিলেট",
                bloodGroup: "O+",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1986-11-25"),
                password: "password123",
                profession: "ব্যবসায়ী",
                email: null, // Explicitly set to null
                weight: 72,
                height: 176,
                // First time donor
            },
            {
                name: "সুমাইয়া আক্তার",
                phone: "01612345713",
                city: "রাজশাহী",
                location: "রাজপাড়া",
                address: "বাড়ি ১০৫, রাজপাড়া, রাজশাহী",
                bloodGroup: "AB+",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1992-02-14"),
                password: "password123",
                email: "sumaiya.akter@example.com",
                profession: "হাসপাতাল প্রশাসক",
                weight: 54,
                height: 158,
                initialTotalDonations: 7,
                initialLastDonationDate: new Date("2024-09-25"), // 3.5 months ago - INELIGIBLE
            },
            {
                name: "জিল্লুর রহমান",
                phone: "01512345714",
                city: "বরিশাল",
                location: "বাবুগঞ্জ",
                address: "বাড়ি ৬৩, বাবুগঞ্জ, বরিশাল",
                bloodGroup: "A-",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1984-08-08"),
                password: "password123",
                profession: "নৌকা চালক",
                email: null, // Explicitly set to null
                weight: 65,
                height: 167,
                initialTotalDonations: 14,
                initialLastDonationDate: new Date("2024-05-02"), // 8 months ago - ELIGIBLE
            },
            {
                name: "রাশিদা পারভীন",
                phone: "01312345715",
                city: "খুলনা",
                location: "সোনাডাঙ্গা",
                address: "বাড়ি ১৭৫, সোনাডাঙ্গা, খুলনা",
                bloodGroup: "B-",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1990-12-01"),
                password: "password123",
                email: "rashida.parvin@example.com",
                profession: "কমিউনিটি হেলথ ওয়ার্কার",
                weight: 58,
                height: 162,
                initialTotalDonations: 5,
                initialLastDonationDate: new Date("2024-06-15"), // 7 months ago - ELIGIBLE
            },
            {
                name: "রিয়াদ হাসান",
                phone: "01412345716",
                city: "রংপুর",
                location: "নিশবেতগঞ্জ",
                address: "বাড়ি ৯১, নিশবেতগঞ্জ, রংপুর",
                bloodGroup: "O-",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1988-07-23"),
                password: "password123",
                profession: "ফটোগ্রাফার",
                email: null, // Explicitly set to null
                weight: 71,
                height: 174,
                // First time donor
            },
            {
                name: "লাইলী আক্তার",
                phone: "01712345717",
                city: "ঢাকা",
                location: "মোহাম্মদপুর",
                address: "বাড়ি ১২৭, মোহাম্মদপুর, ঢাকা",
                bloodGroup: "AB-",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1993-06-10"),
                password: "password123",
                email: "laili.akter@example.com",
                profession: "ওয়েব ডেভেলপার",
                weight: 52,
                height: 159,
                initialTotalDonations: 1,
                initialLastDonationDate: new Date("2024-04-18"), // 8.5 months ago - ELIGIBLE
            },
            {
                name: "আনোয়ার হোসেন",
                phone: "01812345718",
                city: "চট্টগ্রাম",
                location: "এপিসি রোড",
                address: "বাড়ি ৮৪, এপিসি রোড, চট্টগ্রাম",
                bloodGroup: "A+",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1985-04-14"),
                password: "password123",
                profession: "গার্মেন্টস সুপারভাইজার",
                email: null, // Explicitly set to null
                weight: 73,
                height: 178,
                initialTotalDonations: 9,
                initialLastDonationDate: new Date("2024-11-05"), // 2 months ago - INELIGIBLE
            },
            {
                name: "কুলসুম বেগম",
                phone: "01912345719",
                city: "সিলেট",
                location: "সুরমা",
                address: "বাড়ি ৪৮, সুরমা, সিলেট",
                bloodGroup: "B+",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1991-01-07"),
                password: "password123",
                email: "kulsum.begum@example.com",
                profession: "মিডওয়াইফ",
                weight: 60,
                height: 164,
                initialTotalDonations: 6,
                initialLastDonationDate: new Date("2024-02-28"), // 10.5 months ago - ELIGIBLE
            },
            {
                name: "হাবিবুর রহমান",
                phone: "01612345720",
                city: "রাজশাহী",
                location: "উপশহর",
                address: "বাড়ি ১৮৮, উপশহর, রাজশাহী",
                bloodGroup: "O+",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1987-10-19"),
                password: "password123",
                profession: "ফায়ার সার্ভিস",
                email: null, // Explicitly set to null
                weight: 77,
                height: 181,
                // First time donor
            },
            {
                name: "পারভীন সুলতানা",
                phone: "01512345721",
                city: "বরিশাল",
                location: "কীর্তনখোলা",
                address: "বাড়ি ৫৯, কীর্তনখোলা, বরিশাল",
                bloodGroup: "AB+",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1994-05-26"),
                password: "password123",
                email: "parvin.sultana@example.com",
                profession: "কল সেন্টার এজেন্ট",
                weight: 55,
                height: 160,
                initialTotalDonations: 3,
                initialLastDonationDate: new Date("2024-12-10"), // 3 weeks ago - INELIGIBLE
            },
            {
                name: "আব্দুর রউফ",
                phone: "01312345722",
                city: "খুলনা",
                location: "রূপসা",
                address: "বাড়ি ১৩৪, রূপসা, খুলনা",
                bloodGroup: "A-",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1983-12-15"),
                password: "password123",
                profession: "নিউজ রিপোর্টার",
                email: null, // Explicitly set to null
                weight: 69,
                height: 173,
                initialTotalDonations: 20,
                initialLastDonationDate: new Date("2024-01-10"), // 12 months ago - ELIGIBLE
            },
            {
                name: "সাজেদা খাতুন",
                phone: "01412345723",
                city: "রংপুর",
                location: "লালমনিরহাট",
                address: "বাড়ি ৭৮, লালমনিরহাট, রংপুর",
                bloodGroup: "B-",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1989-08-30"),
                password: "password123",
                email: "sajeda.khatun@example.com",
                profession: "এনজিও কর্মী",
                weight: 56,
                height: 161,
                initialTotalDonations: 4,
                initialLastDonationDate: new Date("2024-07-20"), // 5.5 months ago - ELIGIBLE
            },
            {
                name: "মো. আলম",
                phone: "01712345724",
                city: "ঢাকা",
                location: "শ্যামলী",
                address: "বাড়ি ৯৮, শ্যামলী, ঢাকা",
                bloodGroup: "O-",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1986-03-12"),
                password: "password123",
                profession: "গ্যারেজ মালিক",
                email: null, // Explicitly set to null
                weight: 74,
                height: 177,
                // First time donor
            },
            {
                name: "নার্গিস আক্তার",
                phone: "01812345725",
                city: "চট্টগ্রাম",
                location: "নাসিরাবাদ",
                address: "বাড়ি ১১৪, নাসিরাবাদ, চট্টগ্রাম",
                bloodGroup: "AB-",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1992-11-08"),
                password: "password123",
                email: "nargis.akter@example.com",
                profession: "ইউটিউব কনটেন্ট ক্রিয়েটর",
                weight: 53,
                height: 157,
                initialTotalDonations: 2,
                initialLastDonationDate: new Date("2024-08-28"), // 4 months ago - ELIGIBLE
            },
            {
                name: "আশরাফুল ইসলাম",
                phone: "01912345726",
                city: "সিলেট",
                location: "হবিগঞ্জ",
                address: "বাড়ি ৬৭, হবিগঞ্জ, সিলেট",
                bloodGroup: "A+",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1984-06-22"),
                password: "password123",
                profession: "ট্রাক ড্রাইভার",
                email: null, // Explicitly set to null
                weight: 78,
                height: 179,
                initialTotalDonations: 13,
                initialLastDonationDate: new Date("2024-10-08"), // 2.5 months ago - INELIGIBLE
            },
            {
                name: "রেহানা বেগম",
                phone: "01612345727",
                city: "রাজশাহী",
                location: "তানোর",
                address: "বাড়ি ৪১, তানোর, রাজশাহী",
                bloodGroup: "B+",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1990-09-16"),
                password: "password123",
                email: "rehana.begum@example.com",
                profession: "ডেন্টাল অ্যাসিস্ট্যান্ট",
                weight: 57,
                height: 162,
                initialTotalDonations: 8,
                initialLastDonationDate: new Date("2024-05-08"), // 8 months ago - ELIGIBLE
            },
            {
                name: "সেলিম রেজা",
                phone: "01512345728",
                city: "বরিশাল",
                location: "মুলাদী",
                address: "বাড়ি ১২৩, মুলাদী, বরিশাল",
                bloodGroup: "O+",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1988-02-05"),
                password: "password123",
                profession: "খেলার সামগ্রীর দোকানদার",
                email: null, // Explicitly set to null
                weight: 70,
                height: 175,
                // First time donor
            },
            {
                name: "হাসিনা খাতুন",
                phone: "01312345729",
                city: "খুলনা",
                location: "ডাকোপ",
                address: "বাড়ি ৮৫, ডাকোপ, খুলনা",
                bloodGroup: "AB+",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1993-12-24"),
                password: "password123",
                email: "hasina.khatun@example.com",
                profession: "উকিল",
                weight: 58,
                height: 163,
                initialTotalDonations: 5,
                initialLastDonationDate: new Date("2024-11-18"), // 1.5 months ago - INELIGIBLE
            },
            {
                name: "শফিকুল ইসলাম",
                phone: "01412345730",
                city: "রংপুর",
                location: "কুড়িগ্রাম",
                address: "বাড়ি ৫২, কুড়িগ্রাম, রংপুর",
                bloodGroup: "A-",
                gender: "Male",
                religion: "Islam",
                dateOfBirth: new Date("1985-01-18"),
                password: "password123",
                profession: "ভেটেরিনারি ডাক্তার",
                email: null, // Explicitly set to null
                weight: 72,
                height: 176,
                initialTotalDonations: 16,
                initialLastDonationDate: new Date("2024-03-25"), // 9 months ago - ELIGIBLE
            },
            {
                name: "জেবুননেসা",
                phone: "01712345731",
                city: "ঢাকা",
                location: "তেজগাঁও",
                address: "বাড়ি ১০৬, তেজগাঁও, ঢাকা",
                bloodGroup: "B-",
                gender: "Female",
                religion: "Islam",
                dateOfBirth: new Date("1991-05-03"),
                password: "password123",
                email: "jebunnesa@example.com",
                profession: "এয়ার হোস্টেস",
                weight: 54,
                height: 165,
                initialTotalDonations: 3,
                initialLastDonationDate: new Date("2024-06-30"), // 6 months ago - ELIGIBLE
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
        const testDonors = await Donor.find({
            phone: {
                $regex: "^017123456|^018123456|^019123456|^016123456|^015123456|^013123456|^014123456",
            },
        }).limit(10); // Limit to first 10 for console output
        testDonors.forEach((donor) => {
            const eligibility = donor.checkDonationEligibility();
            console.log(
                `${donor.name} (${donor.donorId}): ${eligibility.eligible ? "✅ ELIGIBLE" : "❌ INELIGIBLE"} - ${eligibility.reason}`
            );
        });

        // Generate comprehensive statistics
        console.log("\n📊 Generating Statistics...");

        const allDonors = await Donor.find({
            phone: {
                $regex: "^017[0-9]{8}$|^018[0-9]{8}$|^019[0-9]{8}$|^016[0-9]{8}$|^015[0-9]{8}$|^013[0-9]{8}$|^014[0-9]{8}$",
            },
        });

        // Blood group distribution
        const bloodGroupStats = {};
        const cityStats = {};
        const genderStats = { Male: 0, Female: 0 };
        const eligibilityStats = { eligible: 0, ineligible: 0 };
        const donationStats = { firstTime: 0, experienced: 0 };

        allDonors.forEach((donor) => {
            // Blood group stats
            bloodGroupStats[donor.bloodGroup] =
                (bloodGroupStats[donor.bloodGroup] || 0) + 1;

            // City stats
            cityStats[donor.city] = (cityStats[donor.city] || 0) + 1;

            // Gender stats
            genderStats[donor.gender]++;

            // Eligibility stats
            const eligibility = donor.checkDonationEligibility();
            if (eligibility.eligible) {
                eligibilityStats.eligible++;
            } else {
                eligibilityStats.ineligible++;
            }

            // Donation experience
            if (donor.totalDonations === 0) {
                donationStats.firstTime++;
            } else {
                donationStats.experienced++;
            }
        });

        console.log("\n🩸 Blood Group Distribution:");
        Object.entries(bloodGroupStats).forEach(([bloodGroup, count]) => {
            console.log(`   ${bloodGroup}: ${count} donors`);
        });

        console.log("\n🏙️ City Distribution:");
        Object.entries(cityStats).forEach(([city, count]) => {
            console.log(`   ${city}: ${count} donors`);
        });

        console.log("\n👥 Gender Distribution:");
        console.log(`   Male: ${genderStats.Male} donors`);
        console.log(`   Female: ${genderStats.Female} donors`);

        console.log("\n✅ Eligibility Status:");
        console.log(`   Eligible: ${eligibilityStats.eligible} donors`);
        console.log(`   Ineligible: ${eligibilityStats.ineligible} donors`);

        console.log("\n🎯 Donation Experience:");
        console.log(`   First-time donors: ${donationStats.firstTime} donors`);
        console.log(
            `   Experienced donors: ${donationStats.experienced} donors`
        );

        // Test blood group search
        console.log("\n🔍 Testing Blood Group Search...");
        const oPositiveDonors = await Donor.find({
            bloodGroup: "O+",
            phone: {
                $regex: "^017[0-9]{8}$|^018[0-9]{8}$|^019[0-9]{8}$|^016[0-9]{8}$|^015[0-9]{8}$|^013[0-9]{8}$|^014[0-9]{8}$",
            },
        });
        console.log(`Found ${oPositiveDonors.length} O+ donors`);

        // Test city search
        console.log("\n🏢 Testing City Search...");
        const dhakaDonors = await Donor.find({
            city: "ঢাকা",
            phone: {
                $regex: "^017[0-9]{8}$|^018[0-9]{8}$|^019[0-9]{8}$|^016[0-9]{8}$|^015[0-9]{8}$|^013[0-9]{8}$|^014[0-9]{8}$",
            },
        });
        console.log(`Found ${dhakaDonors.length} donors in Dhaka`);

        // Test eligible donor search
        console.log("\n⏰ Testing Eligible Donor Search...");
        const eligibleDonors = allDonors.filter((donor) => {
            const eligibility = donor.checkDonationEligibility();
            return eligibility.eligible;
        });
        console.log(
            `Found ${eligibleDonors.length} eligible donors out of ${allDonors.length} total`
        );

        // Show sample eligible donors by blood group
        console.log("\n🩸 Eligible Donors by Blood Group (Sample):");
        const eligibleByBloodGroup = {};
        eligibleDonors.forEach((donor) => {
            if (!eligibleByBloodGroup[donor.bloodGroup]) {
                eligibleByBloodGroup[donor.bloodGroup] = [];
            }
            eligibleByBloodGroup[donor.bloodGroup].push(donor);
        });

        Object.entries(eligibleByBloodGroup).forEach(([bloodGroup, donors]) => {
            console.log(`   ${bloodGroup}: ${donors.length} eligible donors`);
            if (donors.length > 0) {
                const sample = donors.slice(0, 2); // Show first 2 as sample
                sample.forEach((donor) => {
                    console.log(
                        `      - ${donor.name} (${donor.donorId}) in ${donor.city}, ${donor.location}`
                    );
                });
                if (donors.length > 2) {
                    console.log(`      ... and ${donors.length - 2} more`);
                }
            }
        });

        console.log("\n🎉 Seeding completed successfully!");
        console.log(`📋 Summary:`);
        console.log(`   - Total donors created: ${createdDonors.length}`);
        console.log(`   - Eligible for donation: ${eligibilityStats.eligible}`);
        console.log(
            `   - Currently ineligible: ${eligibilityStats.ineligible}`
        );
        console.log(`   - First-time donors: ${donationStats.firstTime}`);
        console.log(`   - Experienced donors: ${donationStats.experienced}`);
        console.log(`   - Cities covered: ${Object.keys(cityStats).length}`);
        console.log(
            `   - Blood groups available: ${Object.keys(bloodGroupStats).join(", ")}`
        );
    } catch (error) {
        console.error("❌ Error seeding donors:", error);
    } finally {
        await mongoose.disconnect();
        console.log("\n🔐 Disconnected from MongoDB");
    }
};

seedDonors();
