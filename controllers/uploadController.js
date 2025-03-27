const { uploadImageToCloudinary } = require("../utils/cloudinary");

/**
 * Kullanıcının yüklediği resmi Cloudinary'ye kaydeder ve URL döndürür
 */
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Resim dosyası gereklidir" });
    }

    // Cloudinary'ye yükleme işlemi
    const imageUrl = await uploadImageToCloudinary(req.file.buffer, "profile_pictures");

    res.json({ url: imageUrl }); // Cloudinary'den dönen URL'yi frontend'e gönder
  } catch (error) {
    console.error("Resim yükleme hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

module.exports = { uploadImage };
