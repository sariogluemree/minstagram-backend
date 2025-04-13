const express = require('express');
const Like = require('../models/Like');
const router = express.Router();

// Like Routes
router.post('/like', async (req, res) => {
    try {
        const { userId, postId } = req.body;
        const newLike = new Like({ userId, postId });
        await newLike.save();
        res.status(201).json(newLike);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/like', async (req, res) => {
    try {
        const { userId, postId } = req.body;
        await Like.findOneAndDelete({ userId, postId });
        res.json({ message: 'Like removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/likes/:postId', async (req, res) => {
    try {
        const likes = await Like.find({ postId: req.params.postId }).populate('userId', 'username');
        res.json(likes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
