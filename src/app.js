import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes import
import userRouter from "./routes/user.routes.js";
import donorRouter from "./routes/donor.route.js";
import donorAuthRouter from "./routes/donor-auth.route.js";
import teamMemberRouter from "./routes/teamMember.route.js";
import adminDashboardRouter from "./routes/adminDashboard.route.js";

//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/donors", donorRouter); // Admin/Legacy donor management
app.use("/api/v1/donor-auth", donorAuthRouter); // Donor authentication system
app.use("/api/v1/team-members", teamMemberRouter); // Team members management
app.use("/api/v1/admin", adminDashboardRouter); // Admin dashboard stats

app.get("/", (req, res) => {
    res.json({
        message: "Welcome to Rokto Shebay API",
        status: "Server is running successfully",
    });
});

// http://localhost:8000/api/v1/users/register

// Global error handler (should be after all routes)
app.use((err, req, res, next) => {
    if (err.statusCode) {
        res.status(err.statusCode).json({
            message: err.message,
            statusCode: err.statusCode,
            success: false,
            errors: err.errors || [],
            data: null,
        });
    } else {
        res.status(500).json({
            message: err.message || "Internal Server Error",
            statusCode: 500,
            success: false,
            errors: [],
            data: null,
        });
    }
});

export { app };
