const express = require('express');
const router = express.Router();
const Follow = require('../models/Follow');
const User = require('../models/User');
const mongoose = require('mongoose');

// Bir kullanıcıyı takip et
router.post('/follow', async (req, res) => {
    try {
        const { followerId, followingId } = req.body;

        if (followerId === followingId) {
            return res.status(400).json({ message: 'Kendi kendinizi takip edemezsiniz.' });
        }

        const existingFollow = await Follow.findOne({ followerId, followingId });
        if (existingFollow) {
            return res.status(400).json({ message: 'Zaten bu kullanıcıyı takip ediyorsunuz.' });
        }

        const newFollow = new Follow({ followerId, followingId });
        await newFollow.save();

        res.status(201).json({ message: 'Kullanıcı takip edildi.', follow: newFollow });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası', error });
    }
});

// Takibi bırakma
router.post('/unfollow', async (req, res) => {
    try {
        const { followerId, followingId } = req.body;

        const follow = await Follow.findOneAndDelete({ followerId, followingId });
        if (!follow) {
            return res.status(404).json({ message: 'Takip kaydı bulunamadı.' });
        }

        res.status(200).json({ message: 'Kullanıcı takibi bırakıldı.' });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası', error });
    }
});

// Kullanıcının takip ettiği kişiler (following listesi)
router.get('/following/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const following = await Follow.find({ followerId: userId }).populate('followingId', 'username profileImageUrl');
        res.status(200).json(following);
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası', error });
    }
});

// Kullanıcının takipçileri (followers listesi)
router.get('/followers/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findOne({ username: userId })
        const followers = await Follow.find({ followingId: user._id })
            .populate('followerId', 'username profilePhoto name bio');

        const followerDetails = followers.map(follow => {
            return {
                _id: follow.followerId._id,
                username: follow.followerId.username,
                profilePhoto: follow.followerId.profilePhoto,
                name: follow.followerId.name,
                bio: follow.followerId.bio
            };
        });
        res.status(200).json(followerDetails);
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası', error });
    }
});

module.exports = router;
