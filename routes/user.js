const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middleware/auth'); // Token doğrulama middleware

const isEmail = (input) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
};

// Kullanıcı Kaydı
router.post('/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;

        if (!email || !username || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Email or username already exists' });
        }

        const newUser = new User({ email, username, password});
        await newUser.save();
        res.status(201).json({ newUser, registerMessage: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Kullanıcı Girişi
router.post('/login', async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;
        const query = isEmail(emailOrUsername)
        ? { email: emailOrUsername }
        : { username: emailOrUsername };

        const user = await User.findOne(query);
        if (!user) return res.status(400).json({ message: 'Invalid email or password' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: user.getPublicProfile() });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Kullanıcı Profilini Getirme
router.get('/profile/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ user: { username: user.getPublicProfile() } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Kullanıcı Profilini Güncelleme (Token Gerekli)
router.put('/update', verifyToken, async (req, res) => {
    try {
        const { name, bio, profilePhoto } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            { name, bio, profilePhoto },
            { new: true }
        ).select('-password');

        res.json({ updatedUser: updatedUser.getPublicProfile() });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Kullanıcıyı Silme (Token Gerekli)
router.delete('/delete', verifyToken, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user.userId);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

module.exports = router;
