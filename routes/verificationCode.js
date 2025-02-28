const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const VerificationCode = require('../models/VerificationCode');
const sendVerificationEmail = require('../utils/emailService');

// Kullanıcı e-posta girince doğrulama kodu gönder
router.post('/send-verification-code', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const verificationCode = crypto.randomInt(100000, 999999).toString(); // 6 haneli kod

    try {
        await VerificationCode.findOneAndUpdate(
            { email },
            { code: verificationCode, createdAt: new Date() },
            { upsert: true, new: true }
        );

        await sendVerificationEmail(email, verificationCode);
        res.json({ message: 'Verification code sent' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending verification email' });
    }
});

// Kullanıcı doğrulama kodunu girince kontrol et
router.post('/verify-code', async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });

    const record = await VerificationCode.findOne({ email, code });

    if (!record) return res.status(400).json({ message: 'Invalid or expired code' });

    // Doğrulandıktan sonra kodu sil
    await VerificationCode.deleteOne({ email });

    res.json({ message: 'Email verified successfully' });
});

module.exports = router;
