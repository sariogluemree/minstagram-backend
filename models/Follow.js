const mongoose = require('mongoose');

const FollowSchema = new mongoose.Schema({
  followerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Takip eden
  followingId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Takip edilen
  createdAt: { type: Date, default: Date.now }
}, { collection: "follows" });

FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
FollowSchema.index({ followingId: 1 });
  
module.exports = mongoose.model('Follow', FollowSchema);

