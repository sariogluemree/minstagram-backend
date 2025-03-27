const mongoose = require('mongoose');

const VerificationCodeSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    code: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 300 } // 5 dakika sonra otomatik silinecek
}, { collection: "verificationCodes" });

module.exports = mongoose.model('VerificationCode', VerificationCodeSchema);
