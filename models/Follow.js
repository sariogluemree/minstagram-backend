const mongoose = require('mongoose');

const FollowSchema = new mongoose.Schema({
  followerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Takip eden
  followingId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Takip edilen
  createdAt: { type: Date, default: Date.now }
});
  
module.exports = mongoose.model('Follow', FollowSchema);
