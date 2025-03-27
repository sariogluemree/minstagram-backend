const cloudinary = require("cloudinary").v2;
require("dotenv").config();

// Cloudinary yapılandırması
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Resmi Cloudinary'ye yükler
 * @param {Buffer} fileBuffer - Yüklenen dosyanın buffer verisi
 * @param {String} folder - Kaydedilecek klasör adı (Opsiyonel)
 * @returns {Promise<String>} - Yüklenen resmin URL'si
 */
const uploadImageToCloudinary = (fileBuffer, folder = "uploads") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folder }, // İsteğe bağlı olarak belirli bir klasöre yükleme
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url); // Başarılı olursa URL'yi döndür
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

module.exports = { uploadImageToCloudinary };
