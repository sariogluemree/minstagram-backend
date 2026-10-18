const express = require('express');
const router = express.Router();
const Follow = require('../models/Follow');
const User = require('../models/User');
const mongoose = require('mongoose');
const verifyToken = require('../middleware/auth');
const { createNotification } = require('../utils/notificationService');

// Bir kullanıcıyı takip et
router.post('/follow', verifyToken, async (req, res) => {
    try {
        console.log("FOLLOW");
        const { followingId } = req.body;
        const followerId = req.user.id;

        if (followerId === followingId) {
            return res.status(400).json({ message: 'Kendi kendinizi takip edemezsiniz.' });
        }

        const existingFollow = await Follow.findOne({ followerId, followingId });
        if (existingFollow) {
            return res.status(400).json({ message: 'Zaten bu kullanıcıyı takip ediyorsunuz.' });
        }

        const newFollow = new Follow({ followerId, followingId });
        await newFollow.save();

        await createNotification({
            recipientId: followingId,
            senderId: followerId,
            type: 'follow'
        });

        res.status(201).json({ message: 'Kullanıcı takip edildi.', follow: newFollow });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Takibi bırakma
router.post('/unfollow', verifyToken, async (req, res) => {
    try {
        const { followingId } = req.body;
        const followerId = req.user.id;

        const follow = await Follow.findOneAndDelete({ followerId, followingId });
        if (!follow) {
            return res.status(404).json({ message: 'Takip kaydı bulunamadı.' });
        }

        res.status(200).json({ message: 'Kullanıcı takibi bırakıldı.' });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Takipçiyi çıkarma (kendi takipçilerinden birini silme)
router.post('/removeFollower', verifyToken, async (req, res) => {
    try {
        const { followerId } = req.body;
        const followingId = req.user.id;

        const follow = await Follow.findOneAndDelete({ followerId, followingId });
        if (!follow) {
            return res.status(404).json({ message: 'Takipçi kaydı bulunamadı.' });
        }

        res.status(200).json({ message: 'Takipçi çıkarıldı.' });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Kullanıcının takip ettiği kişiler (following listesi)
router.get('/following/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        let user = await User.findOne({ username: userId });
        if (!user && mongoose.Types.ObjectId.isValid(userId)) {
            user = await User.findById(userId);
        }
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        const following = await Follow.find({ followerId: user._id })
            .populate('followingId', 'username profilePhoto name bio');

        const followingDetails = following
            .filter(follow => follow.followingId != null)
            .map(follow => ({
                _id: follow.followingId._id,
                username: follow.followingId.username,
                profilePhoto: follow.followingId.profilePhoto,
                name: follow.followingId.name,
                bio: follow.followingId.bio
            }));
        res.status(200).json(followingDetails);
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Kullanıcının takipçileri (followers listesi)
router.get('/followers/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        let user = await User.findOne({ username: userId });
        if (!user && mongoose.Types.ObjectId.isValid(userId)) {
            user = await User.findById(userId);
        }
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }
        const followers = await Follow.find({ followingId: user._id })
            .populate('followerId', 'username profilePhoto name bio');

        const followerDetails = followers
            .filter(follow => follow.followerId != null)
            .map(follow => ({
                _id: follow.followerId._id,
                username: follow.followerId.username,
                profilePhoto: follow.followerId.profilePhoto,
                name: follow.followerId.name,
                bio: follow.followerId.bio
            }));
        res.status(200).json(followerDetails);
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Kullanıcının birini takip edip etmediği bilgisi
router.get('/isFollowing', verifyToken, async (req, res) => {
    try {
        const followerId = req.user.id;
        const { followingId } = req.query;

        if (!followingId) {
            return res.status(400).json({ message: 'followingId gereklidir.' });
        }

        const isFollowing = await Follow.exists({ followerId, followingId });

        res.status(200).json({ isFollowing: !!isFollowing });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

module.exports = router;

