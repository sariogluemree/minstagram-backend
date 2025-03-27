const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const verifyToken = require("../middleware/auth");

// 📌 Yeni post oluştur
router.post("/", verifyToken, async (req, res) => {
    try {
        const { imageUrl, caption, tags } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ error: "imageUrl zorunludur." });
        }

        const newPost = new Post({
            userId: req.user.id,
            imageUrl,
            caption,
            tags
        });

        await newPost.save();
        res.status(201).json(newPost);
    } catch (err) {
        res.status(500).json({ error: "Post oluşturulamadı." });
    }
});

// 📌 Tüm postları getir
router.get("/", async (req, res) => {
    try {
        const posts = await Post.find().populate("userId", "username profilePhoto").sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: "Postlar getirilemedi." });
    }
});

// 📌 Belirli bir postu getir
router.get("/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate("userId", "username profilePhoto");
        if (!post) {
            return res.status(404).json({ error: "Post bulunamadı." });
        }
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: "Post getirilemedi." });
    }
});

// 📌 Post sil
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: "Post bulunamadı." });
        }

        if (post.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: "Bu postu silme yetkiniz yok." });
        }

        await post.deleteOne();
        res.json({ message: "Post başarıyla silindi." });
    } catch (err) {
        res.status(500).json({ error: "Post silinemedi." });
    }
});

// 📌 Post güncelle
router.patch("/:id", verifyToken, async (req, res) => {
    try {
        const { caption } = req.body;
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ error: "Post bulunamadı." });
        }

        if (post.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: "Bu postu güncelleme yetkiniz yok." });
        }

        post.caption = caption || post.caption;
        await post.save();
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: "Post güncellenemedi." });
    }
});

module.exports = router;
