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

async function deleteNotification(id) {
  await Notification.findByIdAndDelete(id);
}


module.exports = { createNotification };
