const Notification = require('../models/Notification');

async function createNotification({ recipientId, senderId, type, postId = null, commentId = null }) {
  if (recipientId.toString() === senderId.toString()) return;

  const notification = new Notification({
    recipientId,
    senderId,
    type,
    postId,
    commentId
  });

  await notification.save();
}

module.exports = { createNotification };
