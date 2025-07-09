// src/cron/eligibilityCron.js
// Cron job to update donor eligibility status daily
import cron from "node-cron";
import mongoose from "mongoose";
import { Donor } from "../models/donor.model.js";
import dotenv from "dotenv";
import connectDB from "../db/index.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

connectDB();

// This function will be called daily at 2:00 AM
cron.schedule("0 2 * * *", async () => {
    console.log("[CRON] Starting daily donor eligibility update...");
    try {
        // Get all donors
        const donors = await Donor.find({});
        let updatedCount = 0;
        for (const donor of donors) {
            // Save old values for comparison
            const oldStatus = donor.eligibilityStatus;
            const oldNextEligible = donor.nextEligibleDate?.toISOString();

            // Recalculate eligibility (this updates donor in-memory)
            donor.checkDonationEligibility();

            // Only update if something changed
            if (
                donor.eligibilityStatus !== oldStatus ||
                donor.nextEligibleDate?.toISOString() !== oldNextEligible
            ) {
                await donor.save();
                updatedCount++;
            }
        }
        console.log(
            `[CRON] Donor eligibility update complete. Updated: ${updatedCount}`
        );
    } catch (err) {
        console.error("[CRON] Error updating donor eligibility:", err);
    }
});

// Export for manual trigger if needed
export const runEligibilityCron = async () => {
    console.log("[CRON] Manually running donor eligibility update...");
    try {
        const donors = await Donor.find({});
        let updatedCount = 0;
        for (const donor of donors) {
            const oldStatus = donor.eligibilityStatus;
            const oldNextEligible = donor.nextEligibleDate?.toISOString();
            donor.checkDonationEligibility();
            if (
                donor.eligibilityStatus !== oldStatus ||
                donor.nextEligibleDate?.toISOString() !== oldNextEligible
            ) {
                await donor.save();
                updatedCount++;
            }
        }
        console.log(
            `[CRON] Manual donor eligibility update complete. Updated: ${updatedCount}`
        );
    } catch (err) {
        console.error("[CRON] Error in manual donor eligibility update:", err);
    }
};

// If run directly (not imported), connect to DB first, then run cron
if (process.argv[1] && process.argv[1].endsWith("eligibilityCron.js")) {
    (async () => {
        await connectDB();
        await runEligibilityCron();
        process.exit(0);
    })();
}
