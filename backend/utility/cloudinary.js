const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.APP_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.APP_CLOUDINARY_API_KEY,
  api_secret: process.env.APP_CLOUDINARY_API_SECRET
});

const uploadpic = async (path,userId) => {
  try {
    const result = await cloudinary.uploader.upload(path, {
      folder: process.env.APP_CLOUDINARY_FOLDER,
      public_id: 'user_' + userId,
      overwrite: true          // overwrite if same file name exists
    });
    return result;
  } catch (err) {
    console.error('Cloudinary upload failed:', err);
    return null;
  }
};

module.exports = uploadpic;  // ✅ CommonJS export
