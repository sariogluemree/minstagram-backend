const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Bildirimi alan kişi
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Bildirimi gönderen kişi
  type: { type: String, enum: ['follow', 'like', 'comment', 'tag'], required: true }, // Bildirim türü
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null }, // Post ile ilgiliyse (like,comment, tag)
  commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null}, // Comment bildirimiyse
  createdAt: { type: Date, default: Date.now },
  seen: { type: Boolean, default: false }
});

NotificationSchema.index({ recipientId: 1, seen: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
