import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const fixIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        const db = mongoose.connection.db;
        const collection = db.collection("donors");

        // Get current indexes
        const indexes = await collection.indexes();
        console.log("📋 Current indexes:");
        indexes.forEach((index) => {
            console.log(`   - ${index.name}:`, JSON.stringify(index.key));
        });

        // Drop email index if it exists and recreate it as sparse
        try {
            await collection.dropIndex("email_1");
            console.log("🗑️ Dropped email_1 index");
        } catch (error) {
            console.log("ℹ️ email_1 index not found or already dropped");
        }

        // Create sparse email index
        try {
            await collection.createIndex(
                { email: 1 },
                { unique: true, sparse: true }
            );
            console.log("✅ Created sparse email index");
        } catch (error) {
            console.log("⚠️ Error creating email index:", error.message);
        }

        // Check if there are any documents with empty email strings and convert them to null
        const docsWithEmptyEmail = await collection
            .find({ email: "" })
            .toArray();
        if (docsWithEmptyEmail.length > 0) {
            console.log(
                `🔧 Found ${docsWithEmptyEmail.length} documents with empty email strings`
            );
            await collection.updateMany(
                { email: "" },
                { $unset: { email: 1 } }
            );
            console.log("✅ Converted empty email strings to null");
        }

        console.log("✅ Index fix completed");
    } catch (error) {
        console.error("❌ Error fixing indexes:", error);
    } finally {
        await mongoose.disconnect();
        console.log("🔐 Disconnected from MongoDB");
    }
};

fixIndexes();
