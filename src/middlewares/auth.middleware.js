import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

const verifyJWT = async (req, _, next) => {
    try {
        // find out access token from req
        const accessToken =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        // validate access token
        const decodedToken = await jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken._id);

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
};

const verifyAdmin = async (req, _, next) => {
    if (req.user.role === "admin") return next();
    next(new ApiError(403, "Unauthorized"));
};

export { verifyJWT, verifyAdmin };
