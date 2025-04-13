const express = require('express');
const SavedPost = require('../models/SavedPost');
const router = express.Router();

// SavedPost Routes
router.post('/save', async (req, res) => {
    try {
        const { userId, postId } = req.body;
        const newSavedPost = new SavedPost({ userId, postId });
        await newSavedPost.save();
        res.status(201).json(newSavedPost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/save', async (req, res) => {
    try {
        const { userId, postId } = req.body;
        await SavedPost.findOneAndDelete({ userId, postId });
        res.json({ message: 'Post unsaved' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/saved/:userId', async (req, res) => {
    try {
        const savedPosts = await SavedPost.find({ userId: req.params.userId }).populate('postId');
        res.json(savedPosts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
