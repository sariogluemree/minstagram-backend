const express = require('express');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { createNotification } = require('../utils/notificationService');

// Comment Routes
router.post('/create', verifyToken, async (req, res) => {
    try {
        const { postId, text } = req.body;
        const userId = req.user.id;
        const newComment = new Comment({ userId, postId, text });
        const savedComment = await newComment.save();

        const populatedComment = await Comment.findById(savedComment._id)
        .populate("userId", "username profilePhoto");
        const post = await Post.findById(postId);
        if (!post) return res.status(404).send('Post not found');
        await createNotification({
            recipientId: post.userId,
            senderId: userId,
            type: 'comment',
            postId: postId,
            commentId: populatedComment._id
        });
        res.status(201).json(populatedComment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/getAll/:postId', async (req, res) => {
    try {
        const comments = await Comment.find({ postId: req.params.postId }).populate('userId', 'username');
        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/delete/:id', async (req, res) => {
    try {
        await Comment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Comment deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
