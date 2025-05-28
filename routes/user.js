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
        res.status(201).json({ newUser: await newUser.getPublicProfile(), registerMessage: 'User registered successfully' });
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

        const token = jwt.sign({ id: user._id}, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: await user.getPublicProfile() });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Kullanıcı Profilini Getirme
router.get('/profile/:username', async (req, res) => {
    try {
        console.log("GET USER");
        const user = await User.findOne({ username: req.params.username });

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Query parametresine göre profil tipini belirleme
        const profileType = req.query.type; // ?type=post veya ?type=public
        const profile = profileType === 'post' ? user.getPostProfile() : await user.getPublicProfile();

        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Tüm Kullanıcıları Getir
router.get('/all', async (req, res) => {
    try {
        const userList = await User.find();
        const users = await Promise.all(userList.map(async (user) => {
            const publicUser = user.getPostProfile();
            return publicUser;
        }));
        res.json(users);
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: "Kullanıcılar getirilemedi." });
    }
});

// Kullanıcı Profilini Güncelleme (Token Gerekli)
router.put('/update', verifyToken, async (req, res) => {
    try {
        const { name, username, bio, profilePhoto } = req.body;
        const updatedUser = await User.findByIdAndUpdate(req.user.id, 
            { name, username, bio, profilePhoto }, 
            { new: true }
        );
        res.json( await updatedUser.getPublicProfile());
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Kullanıcıyı Silme (Token Gerekli)
router.delete('/delete', verifyToken, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user.id);
        res.json({ message: 'Your account deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

module.exports = router;
