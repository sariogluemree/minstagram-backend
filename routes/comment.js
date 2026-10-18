const express = require('express');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { createNotification } = require('../utils/notificationService');

// Comment Routes
router.post('/create', verifyToken, async (req, res) => {
    try {
        const { postId, text } = req.body;
        if (!postId || !text || !text.trim()) {
            return res.status(400).json({ message: 'postId and text are required' });
        }

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const userId = req.user.id;
        const newComment = new Comment({ userId, postId, text: text.trim() });
        const savedComment = await newComment.save();

        const populatedComment = await Comment.findById(savedComment._id)
            .populate("userId", "username profilePhoto");

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
        const comments = await Comment.find({ postId: req.params.postId }).populate('userId', 'username profilePhoto');
        res.json(comments.filter(c => c.userId != null));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/delete/:id', verifyToken, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const post = await Post.findById(comment.postId);
        const isCommentOwner = comment.userId.toString() === req.user.id;
        const isPostOwner = post && post.userId.toString() === req.user.id;

        if (!isCommentOwner && !isPostOwner) {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        await Promise.all([
            comment.deleteOne(),
            Notification.deleteMany({ commentId: comment._id })
        ]);
        res.json({ message: 'Comment deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

