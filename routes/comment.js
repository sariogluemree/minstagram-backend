const express = require('express');
const Comment = require('../models/Comment');
const router = express.Router();
const verifyToken = require('../middleware/auth');

// Comment Routes
router.post('/create', verifyToken, async (req, res) => {
    try {
        const { postId, text } = req.body;
        const userId = req.user.id;
        const newComment = new Comment({ userId, postId, text });
        const savedComment = await newComment.save();

        const populatedComment = await Comment.findById(savedComment._id)
        .populate("userId", "username profilePhoto");
        //console.log("populated comment:", populatedComment);

        res.status(201).json(populatedComment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/getAll/:postId', async (req, res) => {
    try {
        const comments = await Comment.find({ postId: req.params.postId }).populate('userId', 'username');
        //console.log(comments);
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
