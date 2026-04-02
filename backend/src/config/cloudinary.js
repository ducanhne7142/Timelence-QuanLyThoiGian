const cloudinary = require('cloudinary').v2;

// Cloudinary tự động config từ CLOUDINARY_URL env variable
// Hoặc có thể config manual:
// cloudinary.config({
//     cloud_name: 'dhssvh0ss',
//     api_key: '851921688157234',
//     api_secret: 'DoNp3nXiFRpXTyvgb3PgEP-N4qg'
// });

const uploadToCloudinary = async (fileBuffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadOptions = {
            folder: 'schedule-app/avatars',
            resource_type: 'image',
            transformation: [
                { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                { quality: 'auto', fetch_format: 'auto' }
            ],
            ...options
        };

        cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        }).end(fileBuffer);
    });
};

const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        return null;
    }
};

// Extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url) => {
    if (!url || !url.includes('cloudinary')) return null;

    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v123/folder/filename.ext
    const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
    return matches ? matches[1] : null;
};

module.exports = {
    cloudinary,
    uploadToCloudinary,
    deleteFromCloudinary,
    getPublicIdFromUrl
};
