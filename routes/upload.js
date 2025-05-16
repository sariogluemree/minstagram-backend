const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const cloudinary = require("../utils/cloudinary");

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const type = req.body.type || "posts"; // varsayılan olarak 'posts' klasörüne at

    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: type },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        stream.end(req.file.buffer);
      });
    };

    const result = await streamUpload(req);

    return res.status(200).json({
      url: result.secure_url,
      public_id: result.public_id,
    });

  } catch (err) {
    res.status(500).json({ error: "Upload failed" });
  }
});


module.exports = router;
