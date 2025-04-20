const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const cloudinary = require("../utils/cloudinary");

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload_stream(
      {
        folder: "posts",
      },
      (error, result) => {
        if (error) return res.status(500).json({ error });

        return res.status(200).json({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    // Resmi stream olarak yükle
    result.end(req.file.buffer);

  } catch (err) {
    res.status(500).json({ error: "Upload failed" });
  }
});

module.exports = router;
