const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Like = require("../models/Like");
const verifyToken = require("../middleware/auth");
const Follow = require("../models/Follow");
const SavedPost = require("../models/SavedPost");

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
        const populatedPost = await Post.findById(savedPost._id)
        .populate("userId", "username profilePhoto")
        .populate("tags.taggedUser", "username profilePhoto");
        //console.log("Populated Post", populatedPost);

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
            userId: {
                _id: populatedPost.userId._id,
                username: populatedPost.userId.username,
                profilePhoto: populatedPost.userId.profilePhoto
            },
            comments: [],
            likeCount: 0,
            isLiked: false,
            isSaved: false
        });
    } catch (err) {
        res.status(500).json({ error: "Post oluşturulamadı." });
    }
});

// 📌 Tüm postları getir
router.get("/feed", verifyToken, async (req, res) => {
    try {
        console.log("FEED");
        const activeUserId = req.user.id;
        const followings = await Follow.find({ followerId: activeUserId }).select('followingId');
        const followingIds = followings.map(f => f.followingId);

        const rawPosts = await Post.find({ userId: {$in: [activeUserId, ...followingIds]} })
            .populate("userId", "username profilePhoto")
            .populate("tags.taggedUser", "username profilePhoto")
            .sort({ createdAt: -1 });

        const posts = await Promise.all(rawPosts.map(async (post) => {
            const postObj = post.toObject();

            const comments = await Comment.find({ postId: post._id })
                .populate("userId", "username profilePhoto")
                .sort({ createdAt: 1 });

            const likeCount = await Like.countDocuments({ postId: post._id });

            const existingLike = await Like.findOne({ postId: post._id, userId: activeUserId });
            const likeFlag = existingLike ? true : false;
            const existingSave = await SavedPost.findOne({ postId: post._id, userId: activeUserId });
            const saveFlag = existingSave ? true : false;

            postObj.comments = comments;
            postObj.likeCount = likeCount;
            postObj.isLiked = likeFlag;
            postObj.isSaved = saveFlag;

            return postObj;
        }));
        console.log(posts);
        res.json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Postlar getirilemedi." });
    }
});


router.get('/post/:postId', verifyToken, async (req, res) => {
    try {
        console.log("GET POST");
        const { postId } = req.params;
        const activeUserId = req.user.id;

        const post = await Post.findById(postId)
            .populate('userId', 'username profilePhoto')
            .populate("tags.taggedUser", "username profilePhoto");

        if (!post) {
            return res.status(404).json({ message: "Post bulunamadı" });
        }

        const postObj = post.toObject();
        const comments = await Comment.find({ postId })
            .populate('userId', 'username profilePhoto')
            .sort({ createdAt: 1 });
        const likeCount = await Like.countDocuments({ postId });
        const existingLike = await Like.findOne({ postId: post._id, userId: activeUserId });
        const isLiked = existingLike ? true : false;
        const existingSave = await SavedPost.findOne({ postId: post._id, userId: activeUserId });
        const isSaved = existingSave ? true : false;
        postObj.comments = comments;
        postObj.likeCount = likeCount;
        postObj.isLiked = isLiked;
        postObj.isSaved = isSaved;

        res.status(200).json(postObj);
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
