const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  createdAt: { type: Date, default: Date.now }
});

LikeSchema.index({ userId: 1, postId: 1 }, { unique: true });
  
module.exports = mongoose.model('Like', LikeSchema);
