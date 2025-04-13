const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Like = require("../models/Like");
const User = require("../models/User")
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
            imageUrl: imageUrl,
            caption: caption,
            tags: tags
        });

        const savedPost = await newPost.save();
        console.log("Saved Post: ", savedPost);

        const populatedPost = await Post.findById(savedPost._id)
        .populate("userId", "username profilePhoto")
        .populate("tags.taggedUser", "username profilePhoto");
        console.log("Populated Post", populatedPost);

        res.status(201).json({
            _id: populatedPost._id,
            imageUrl: populatedPost.imageUrl,
            caption: populatedPost.caption,
            tags: populatedPost.tags.map(tag => ({
                taggedUser: {
                    _id: tag.taggedUser._id,
                    username: tag.taggedUser.username,
                    profilePhoto: tag.taggedUser.profilePhoto
                },
                position: tag.position
            })),
            createdAt: populatedPost.createdAt,
            user: {
                _id: populatedPost.userId._id,
                username: populatedPost.userId.username,
                profilePhoto: populatedPost.userId.profilePhoto
            },
            comments: [],
            likeCount: 0
        });
    } catch (err) {
        res.status(500).json({ error: "Post oluşturulamadı." });
    }
});

// 📌 Tüm postları getir
router.get("/", async (req, res) => {
    console.log("get posts");
    try {
        const posts = await Post.find().populate("userId", "username profilePhoto").sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: "Postlar getirilemedi." });
    }
});

router.get('/posts/:postId', async (req, res) => {
    try {
        const { postId } = req.params;

        const post = await Post.findById(postId)
            .populate('userId', 'username profilePhoto') // Kullanıcı bilgilerini getir
            .lean(); // Daha hızlı işlem için JSON olarak döndür

        if (!post) {
            return res.status(404).json({ message: "Post bulunamadı" });
        }

        // Yorumları getir
        const comments = await Comment.find({ postId })
            .populate('userId', 'username profilePhoto')
            .lean();

        // Beğeni sayısını getir
        const likeCount = await Like.countDocuments({ postId });

        // Sonuçları birleştir
        const postData = {
            ...post,
            comments,
            likeCount
        };

        res.status(200).json(postData);
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası', error });
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
