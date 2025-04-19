const express = require('express');
const SavedPost = require('../models/SavedPost');
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

router.get('/getAll/:userId', async (req, res) => {
    try {
        const savedPosts = await SavedPost.find({ userId: req.params.userId }).populate('postId');
        res.json(savedPosts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
