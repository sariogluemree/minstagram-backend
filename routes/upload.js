const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const cloudinary = require("../utils/cloudinary");
const verifyToken = require("../middleware/auth");

const ALLOWED_FOLDERS = new Set(["posts", "profilePhotos"]);

router.post("/upload", verifyToken, upload.single("image"), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const requestedType = req.body.type || "posts"; // varsayılan olarak 'posts' klasörüne at
    const folder = ALLOWED_FOLDERS.has(requestedType) ? requestedType : "posts";

    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        stream.end(buffer);
      });
    };

    const result = await streamUpload(req.file.buffer);

    return res.status(200).json({
      url: result.secure_url,
      public_id: result.public_id,
    });

  } catch (err) {
    res.status(500).json({ error: "Upload failed" });
  }
});

router.delete("/delete", verifyToken, async (req, res) => {
  const { public_id } = req.body;
  if (!public_id || typeof public_id !== "string") {
    return res.status(400).json({ error: "public_id is required" });
  }

  try {
    const result = await cloudinary.uploader.destroy(public_id);
    res.status(200).json({ message: "Image deleted", result });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete image" });
  }
});

module.exports = router;

