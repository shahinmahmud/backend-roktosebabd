// src/controllers/adminDashboard.controller.js
import { Donor } from "../models/donor.model.js";
import { User } from "../models/user.model.js";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// import { EmergencyRequest } from "../models/emergencyRequest.model.js"; // Uncomment if/when model exists
// import { Activity } from "../models/activity.model.js"; // Uncomment if/when model exists

export const getAdminDashboardStats = async (req, res) => {
    try {
        // 1. Total Donors
        const totalDonors = await Donor.countDocuments();

        // 2. Active Donors
        const activeDonors = await Donor.countDocuments({
            accountStatus: "ACTIVE",
        });

        // 3. Pending Donors
        const pendingDonors = await Donor.countDocuments({
            accountStatus: "PENDING",
        });

        // 4. Suspended Donors
        const suspendedDonors = await Donor.countDocuments({
            accountStatus: "SUSPENDED",
        });

        // 5. Total Donations (sum of all donors' totalDonations)
        const totalDonationsAgg = await Donor.aggregate([
            { $group: { _id: null, total: { $sum: "$totalDonations" } } },
        ]);
        const totalDonations = totalDonationsAgg[0]?.total || 0;

        // 6. This Month's Donations (sum of all donations in this month)
        const startOfMonth = new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
        );
        const thisMonthDonationsAgg = await Donor.aggregate([
            { $unwind: "$donationHistory" },
            {
                $match: {
                    "donationHistory.donationDate": { $gte: startOfMonth },
                },
            },
            { $group: { _id: null, count: { $sum: 1 } } },
        ]);
        const thisMonthDonations = thisMonthDonationsAgg[0]?.count || 0;

        // 7. Blood Group Stats (count and percentage)
        const bloodGroupAgg = await Donor.aggregate([
            { $group: { _id: "$bloodGroup", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);
        const bloodGroupStats = bloodGroupAgg.map((bg) => ({
            bloodGroup: bg._id,
            count: bg.count,
            percentage: totalDonors
                ? Math.round((bg.count / totalDonors) * 100)
                : 0,
        }));

        // 8. Total Users
        const totalUsers = await User.countDocuments();

        // 9. Emergency Requests (set to 0 for now)
        const emergencyRequests = 0; // Update if/when model exists

        // 10. Recent Activities (empty array for now)
        const recentActivities = [];

        res.json({
            stats: {
                totalDonors,
                activeDonors,
                pendingDonors,
                suspendedDonors,
                totalDonations,
                thisMonthDonations,
                totalUsers,
                emergencyRequests,
            },
            bloodGroupStats,
            recentActivities,
        });
    } catch (err) {
        res.status(500).json({
            message: "Dashboard stats fetch failed",
            error: err.message,
        });
    }
};
