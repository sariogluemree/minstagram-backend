const express = require('express');
const Comment = require('../models/Comment');
const router = express.Router();

// Comment Routes
router.post('/comment', async (req, res) => {
    try {
        const { userId, postId, text } = req.body;
        const newComment = new Comment({ userId, postId, text });
        await newComment.save();
        res.status(201).json(newComment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/comments/:postId', async (req, res) => {
    try {
        const comments = await Comment.find({ postId: req.params.postId }).populate('userId', 'username');
        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/comment/:id', async (req, res) => {
    try {
        await Comment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Comment deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
