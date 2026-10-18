const express = require('express');
const SavedPost = require('../models/SavedPost');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const router = express.Router();
const verifyToken = require('../middleware/auth');

// SavedPost Routes
router.post('/save', verifyToken, async (req, res) => {
    try {
        const { postId } = req.body;
        const userId = req.user.id;
        const isExisting = await SavedPost.findOne({ postId, userId });
        if (isExisting) {
            return res.status(400).json({ message: 'Post already saved' });
        }
        const newSavedPost = new SavedPost({ userId, postId });
        await newSavedPost.save();
        res.status(201).json(newSavedPost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/unsave', verifyToken, async (req, res) => {
    try {
        const { postId } = req.body;
        const userId = req.user.id;
        await SavedPost.findOneAndDelete({ userId, postId });
        res.json({ message: 'Post unsaved' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/getAll/:userId', verifyToken, async (req, res) => {
    try {
        const activeUserId = req.user.id;
        const savedEntries = await SavedPost.find({ userId: req.params.userId })
            .sort({ createdAt: -1 })
            .populate({
                path: 'postId',
                populate: [
                    { path: 'userId', select: 'username profilePhoto' },
                    { path: 'tags.taggedUser', select: 'username profilePhoto' }
                ]
            });

        const rawPosts = savedEntries
            .map(entry => entry.postId)
            .filter(post => post && post.userId != null);

        if (rawPosts.length === 0) {
            return res.json([]);
        }

        const postIds = rawPosts.map(post => post._id);
        const [allComments, likeCounts, userLikes, userSaves] = await Promise.all([
            Comment.find({ postId: { $in: postIds } })
                .populate('userId', 'username profilePhoto')
                .sort({ createdAt: 1 }),
            Like.aggregate([
                { $match: { postId: { $in: postIds } } },
                { $group: { _id: '$postId', count: { $sum: 1 } } }
            ]),
            Like.find({ postId: { $in: postIds }, userId: activeUserId }).select('postId'),
            SavedPost.find({ postId: { $in: postIds }, userId: activeUserId }).select('postId')
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

        const hydratedPosts = rawPosts.map(post => {
            const postObj = post.toObject();
            const key = post._id.toString();
            postObj.tags = (postObj.tags || []).filter(tag => tag && tag.taggedUser != null);
            postObj.comments = commentsByPostId.get(key) || [];
            postObj.likeCount = likeCountByPostId.get(key) || 0;
            postObj.isLiked = likedPostIds.has(key);
            postObj.isSaved = savedPostIds.has(key);
            return postObj;
        });

        res.json(hydratedPosts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

