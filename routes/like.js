const express = require('express');
const Like = require('../models/Like');
const Post = require('../models/Post');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { createNotification } = require('../utils/notificationService');

// Like Routes
router.post('/like', verifyToken, async (req, res) => {
    try {
        console.log("LIKE");
        const { postId } = req.body;
        const userId = req.user.id;
        const existingLike = await Like.findOne({ postId, userId });
        if (existingLike) {
            return res.status(400).json({ message: 'Post already liked' });
        }
        const newLike = new Like({ userId, postId });
        const savedLike = await newLike.save();
        const populatedLike = await Like.findById(savedLike._id)
        .populate("userId", "username profilePhoto");
        const post = await Post.findById(postId);
        if (!post) return res.status(404).send('Post not found');
        await createNotification({
            recipientId: post.userId,
            senderId: userId,
            type: 'like',
            postId: postId
        });
        res.status(201).json(populatedLike);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/unlike', verifyToken, async (req, res) => {
    try {
        console.log("UNLIKE");
        const { postId } = req.body;
        const userId = req.user.id;
        await Like.findOneAndDelete({ userId, postId });
        res.json({ message: 'Like removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/getAll/:postId', async (req, res) => {
    try {
        const likes = await Like.find({ postId: req.params.postId }).populate('userId', 'username');
        res.json(likes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
