import dotenv from "dotenv";
dotenv.config();

import connectDB from "../db/index.js";
import { app } from "../app.js";

// Vercel serverless handler
export default async function handler(req, res) {
    try {
        await connectDB();
        return app(req, res); // Express app কে request/res এ pass করো
    } catch (err) {
        console.error("MONGO db connection failed !!! ", err);
        res.status(500).send("Internal Server Error");
    }
}
