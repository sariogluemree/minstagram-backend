const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Like = require("../models/Like");
const verifyToken = require("../middleware/auth");
const Follow = require("../models/Follow");
const SavedPost = require("../models/SavedPost");
const Notification = require("../models/Notification");
const { createNotification } = require('../utils/notificationService');

async function hydratePosts(rawPosts, activeUserId) {
    const validPosts = rawPosts.filter(post => post && post.userId != null);
    if (validPosts.length === 0) return [];

    const postIds = validPosts.map(post => post._id);

    const [allComments, likeCounts, userLikes, userSaves] = await Promise.all([
        Comment.find({ postId: { $in: postIds } })
            .populate("userId", "username profilePhoto")
            .sort({ createdAt: 1 }),
        Like.aggregate([
            { $match: { postId: { $in: postIds } } },
            { $group: { _id: "$postId", count: { $sum: 1 } } }
        ]),
        Like.find({ postId: { $in: postIds }, userId: activeUserId }).select("postId"),
        SavedPost.find({ postId: { $in: postIds }, userId: activeUserId }).select("postId")
    ]);

    const commentsByPostId = new Map();
    for (const comment of allComments) {
        if (!comment.userId) continue;
        const key = comment.postId.toString();
        if (!commentsByPostId.has(key)) {
            commentsByPostId.set(key, []);
        }
        commentsByPostId.get(key).push(comment);
    }

    const likeCountByPostId = new Map(
        likeCounts.map(item => [item._id.toString(), item.count])
    );
    const likedPostIds = new Set(userLikes.map(like => like.postId.toString()));
    const savedPostIds = new Set(userSaves.map(save => save.postId.toString()));

    return validPosts.map(post => {
        const postObj = post.toObject();
        const key = post._id.toString();

        postObj.tags = (postObj.tags || []).filter(tag => tag && tag.taggedUser != null);
        postObj.comments = commentsByPostId.get(key) || [];
        postObj.likeCount = likeCountByPostId.get(key) || 0;
        postObj.isLiked = likedPostIds.has(key);
        postObj.isSaved = savedPostIds.has(key);

        return postObj;
    });
}

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

        const tagsToIterate = tags || [];
        for (const tag of tagsToIterate) {
            if (tag?.taggedUser) {
                await createNotification({
                    recipientId: tag.taggedUser,
                    senderId: req.user.id,
                    type: 'tag',
                    postId: populatedPost._id,
                });
            }
        }

        res.status(201).json({
            _id: populatedPost._id,
            imageUrl: populatedPost.imageUrl,
            caption: populatedPost.caption,
            tags: (populatedPost.tags || [])
                .filter(tag => tag && tag.taggedUser != null)
                .map(tag => ({
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

router.get('/post/:postId', verifyToken, async (req, res) => {
    try {
        console.log("GET POST");
        const { postId } = req.params;
        const activeUserId = req.user.id;

        const post = await Post.findById(postId)
            .populate('userId', 'username profilePhoto')
            .populate("tags.taggedUser", "username profilePhoto");

        if (!post || !post.userId) {
            return res.status(404).json({ message: "Post bulunamadı" });
        }

        const [hydratedPost] = await hydratePosts([post], activeUserId);
        res.status(200).json(hydratedPost);
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
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

        post.caption = caption !== undefined ? caption : post.caption;
        await post.save();
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: "Post güncellenemedi." });
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

        await Promise.all([
            post.deleteOne(),
            Comment.deleteMany({ postId: post._id }),
            Like.deleteMany({ postId: post._id }),
            SavedPost.deleteMany({ postId: post._id }),
            Notification.deleteMany({ postId: post._id })
        ]);
        res.json({ message: "Post başarıyla silindi." });
    } catch (err) {
        res.status(500).json({ error: "Post silinemedi." });
    }
});

// 📌 Bir user'ın postlarını getir
router.get("/forUser/:userId", verifyToken, async (req, res) => {
    try {
        console.log("GET USER's POSTS");
        const activeUserId = req.user.id;
        const userId = req.params.userId;

        const rawPosts = await Post.find({ userId: userId })
            .populate("userId", "username profilePhoto")
            .populate("tags.taggedUser", "username profilePhoto")
            .sort({ createdAt: -1 });

        const posts = await hydratePosts(rawPosts, activeUserId);
        res.json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Postlar getirilemedi." });
    }
});

// 📌 Tüm postları getir
router.get("/feed", verifyToken, async (req, res) => {
    try {
        console.log("FEED");
        const activeUserId = req.user.id;
        const followings = await Follow.find({ followerId: activeUserId }).select('followingId');
        const followingIds = followings.map(f => f.followingId);

        const rawPosts = await Post.find({ userId: { $in: [activeUserId, ...followingIds] } })
            .populate("userId", "username profilePhoto")
            .populate("tags.taggedUser", "username profilePhoto")
            .sort({ createdAt: -1 });

        const posts = await hydratePosts(rawPosts, activeUserId);
        res.json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Postlar getirilemedi." });
    }
});

module.exports = router;

