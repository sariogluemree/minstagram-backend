const mongoose = require('mongoose');

const CloseFriendSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Kullanıcı
  closeFriendId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Yakın arkadaş eklenen kişi
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CloseFriend', CloseFriendSchema);
