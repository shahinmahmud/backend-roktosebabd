import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import sharp from "sharp";
import path from "path";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Get public_id from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null
 */
const getPublicIdFromUrl = (url) => {
    if (!url) return null;
    try {
        // Extract public_id from URL like: https://res.cloudinary.com/cloud/image/upload/v123456/folder/filename.jpg
        const urlParts = url.split("/");
        const uploadIndex = urlParts.indexOf("upload");
        if (uploadIndex === -1) return null;

        // Get everything after upload/v{version}/
        const pathAfterVersion = urlParts.slice(uploadIndex + 2).join("/");
        // Remove file extension
        return pathAfterVersion.replace(/\.[^/.]+$/, "");
    } catch (error) {
        console.error("Error extracting public_id from URL:", error);
        return null;
    }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image to delete
 * @returns {Promise<boolean>} - Success status
 */
const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return false;

        const result = await cloudinary.uploader.destroy(publicId);
        return result.result === "ok";
    } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
        return false;
    }
};

/**
 * Compress image if it's larger than 100KB
 * @param {string} filePath - Path to the image file
 * @returns {Promise<string>} - Path to the compressed image (same or new path)
 */
const compressImageIfNeeded = async (filePath) => {
    try {
        const stats = fs.statSync(filePath);
        const fileSizeInKB = stats.size / 1024;

        // If file is 100KB or less, no compression needed
        if (fileSizeInKB <= 100) {
            return filePath;
        }

        const ext = path.extname(filePath).toLowerCase();
        const dir = path.dirname(filePath);
        const name = path.basename(filePath, ext);
        const compressedPath = path.join(dir, `${name}_compressed${ext}`);

        let sharpInstance = sharp(filePath);

        // Get image metadata to preserve aspect ratio
        const metadata = await sharpInstance.metadata();

        // Compress based on format
        if (ext === ".jpg" || ext === ".jpeg") {
            await sharpInstance
                .jpeg({
                    quality: 80,
                    progressive: true,
                    mozjpeg: true,
                })
                .toFile(compressedPath);
        } else if (ext === ".png") {
            await sharpInstance
                .png({
                    quality: 80,
                    compressionLevel: 8,
                    progressive: true,
                })
                .toFile(compressedPath);
        } else if (ext === ".webp") {
            await sharpInstance
                .webp({
                    quality: 80,
                    effort: 6,
                })
                .toFile(compressedPath);
        } else {
            // For other formats, try generic compression
            await sharpInstance.jpeg({ quality: 80 }).toFile(compressedPath);
        }

        // Ensure Sharp releases all resources
        sharpInstance.destroy();
        sharpInstance = null;

        // Add a small delay to ensure file handles are released (Windows fix)
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Check if compression was successful and reduced file size
        const compressedStats = fs.statSync(compressedPath);
        const compressedSizeInKB = compressedStats.size / 1024;

        if (compressedSizeInKB < fileSizeInKB) {
            // Remove original file and return compressed path
            try {
                fs.unlinkSync(filePath);
            } catch (unlinkError) {
                console.warn(
                    "Warning: Could not delete original file:",
                    unlinkError.message
                );
                // Continue anyway, compressed file is available
            }
            return compressedPath;
        } else {
            // Compression didn't help, remove compressed file and return original
            try {
                fs.unlinkSync(compressedPath);
            } catch (unlinkError) {
                console.warn(
                    "Warning: Could not delete compressed file:",
                    unlinkError.message
                );
            }
            return filePath;
        }
    } catch (error) {
        console.error("Error compressing image:", error);
        return filePath; // Return original path if compression fails
    }
};

/**
 * Compress image buffer if it's larger than 100KB
 * @param {Buffer} buffer - Image buffer
 * @param {string} mimetype - Image mimetype (e.g., 'image/jpeg')
 * @returns {Promise<Buffer>} - Compressed image buffer
 */
const compressImageBufferIfNeeded = async (buffer, mimetype) => {
    try {
        const fileSizeInKB = buffer.length / 1024;
        if (fileSizeInKB <= 100) {
            return buffer;
        }
        let sharpInstance = sharp(buffer);
        let compressedBuffer;
        if (mimetype === "image/jpeg" || mimetype === "image/jpg") {
            compressedBuffer = await sharpInstance
                .jpeg({ quality: 80, progressive: true, mozjpeg: true })
                .toBuffer();
        } else if (mimetype === "image/png") {
            compressedBuffer = await sharpInstance
                .png({ quality: 80, compressionLevel: 8, progressive: true })
                .toBuffer();
        } else if (mimetype === "image/webp") {
            compressedBuffer = await sharpInstance
                .webp({ quality: 80, effort: 6 })
                .toBuffer();
        } else {
            compressedBuffer = await sharpInstance
                .jpeg({ quality: 80 })
                .toBuffer();
        }
        // If compression didn't help, return original
        if (compressedBuffer.length < buffer.length) {
            return compressedBuffer;
        } else {
            return buffer;
        }
    } catch (error) {
        console.error("Error compressing image buffer:", error);
        return buffer;
    }
};

/**
 * Upload image to Cloudinary with folder organization, auto-delete, and compression
 * @param {string} localFilePath - Path to the local file
 * @param {string} folder - Folder name (donor, user, admin, moderator, etc.)
 * @param {string} oldImageUrl - URL of the old image to delete (optional)
 * @returns {Promise<Object|null>} - Cloudinary response or null
 */
const uploadOnCloudinary = async (
    localFilePath,
    folder = "general",
    oldImageUrl = null
) => {
    try {
        if (!localFilePath) return null;

        // Delete old image if provided
        if (oldImageUrl) {
            const oldPublicId = getPublicIdFromUrl(oldImageUrl);
            if (oldPublicId) {
                await deleteFromCloudinary(oldPublicId);
            }
        }

        // Compress image if needed
        const finalFilePath = await compressImageIfNeeded(localFilePath);

        // Upload the file to Cloudinary with folder
        const response = await cloudinary.uploader.upload(finalFilePath, {
            resource_type: "auto",
            folder: folder,
            use_filename: true,
            unique_filename: true,
            quality: "auto:good",
            fetch_format: "auto",
        });

        // Clean up local file
        try {
            fs.unlinkSync(finalFilePath);
        } catch (cleanupError) {
            console.warn(
                "Warning: Could not delete uploaded file:",
                cleanupError.message
            );
            // Continue anyway, upload was successful
        }

        console.log(
            `File uploaded successfully to Cloudinary folder: ${folder}`
        );
        return response;
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        // Clean up local file even if upload failed
        try {
            if (fs.existsSync(localFilePath)) {
                // Add delay before cleanup for Windows file locking
                await new Promise((resolve) => setTimeout(resolve, 100));
                fs.unlinkSync(localFilePath);
            }
        } catch (cleanupError) {
            console.warn(
                "Warning: Could not clean up local file:",
                cleanupError.message
            );
        }
        return null;
    }
};

/**
 * Upload image buffer to Cloudinary with folder organization, auto-delete, and compression
 * @param {Buffer} buffer - Image buffer
 * @param {string} mimetype - Image mimetype (e.g., 'image/jpeg')
 * @param {string} filename - Original filename (for Cloudinary naming)
 * @param {string} folder - Folder name (donor, user, admin, moderator, etc.)
 * @param {string} oldImageUrl - URL of the old image to delete (optional)
 * @returns {Promise<Object|null>} - Cloudinary response or null
 */
const uploadBufferOnCloudinary = async (
    buffer,
    mimetype,
    filename,
    folder = "general",
    oldImageUrl = null
) => {
    try {
        if (!buffer) return null;
        // Delete old image if provided
        if (oldImageUrl) {
            const oldPublicId = getPublicIdFromUrl(oldImageUrl);
            if (oldPublicId) {
                await deleteFromCloudinary(oldPublicId);
            }
        }
        // Compress image if needed
        const finalBuffer = await compressImageBufferIfNeeded(buffer, mimetype);
        // Upload buffer to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "auto",
                    folder: folder,
                    use_filename: true,
                    unique_filename: true,
                    quality: "auto:good",
                    fetch_format: "auto",
                    filename_override: filename,
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
            uploadStream.end(finalBuffer);
        });
        console.log(
            `File uploaded successfully to Cloudinary folder: ${folder}`
        );
        return uploadResult;
    } catch (error) {
        console.error("Error uploading buffer to Cloudinary:", error);
        return null;
    }
};

/**
 * Legacy function for backward compatibility
 * @param {string} localFilePath - Path to the local file
 * @returns {Promise<Object|null>} - Cloudinary response or null
 */
const uploadOnCloudinaryLegacy = async (localFilePath) => {
    return uploadOnCloudinary(localFilePath, "general");
};

export {
    uploadOnCloudinary,
    uploadOnCloudinaryLegacy,
    deleteFromCloudinary,
    getPublicIdFromUrl,
    compressImageIfNeeded,
    compressImageBufferIfNeeded,
    uploadBufferOnCloudinary,
};
