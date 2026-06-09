import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    // If connection is already established, reuse it
    if (mongoose.connection.readyState >= 1) {
        console.log("MongoDB already connected, reusing existing connection.");
        return;
    }

    try {
        const connectionInstance = await mongoose.connect(
            process.env.MONGODB_URI,
            {
                serverSelectionTimeoutMS: 5000,
            }
        );
        console.log(
            `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
        );
    } catch (error) {
        console.error("MONGODB connection FAILED: ", error);
        // Throw error so serverless function can return 500 status rather than crashing container
        throw error;
    }
};

export default connectDB;
