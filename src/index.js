import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import connectDB from "./db/index.js";
import { app } from "./app.js";

// Local development only
if (process.env.NODE_ENV !== "production") {
  connectDB()
    .then(() => {
      app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
      });
    })
    .catch((err) => {
      console.log("MONGO db connection failed !!! ", err);
    });
}

// For Vercel serverless, just export app
export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (err) {
    console.error("MONGO db connection failed !!! ", err);
    res.status(500).send("Internal Server Error");
  }
}
