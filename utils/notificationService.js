const Notification = require('../models/Notification');

function extractIdString(value) {
  if (!value) return null;
  if (typeof value === 'object' && value._id) {
    return value._id.toString();
  }
  return value.toString();
}

async function createNotification({ recipientId, senderId, type, postId = null, commentId = null }) {
  const normalizedRecipientId = extractIdString(recipientId);
  const normalizedSenderId = extractIdString(senderId);

  if (!normalizedRecipientId || !normalizedSenderId) return;
  if (normalizedRecipientId === normalizedSenderId) return;

  const notification = new Notification({
    recipientId: normalizedRecipientId,
    senderId: normalizedSenderId,
    type,
    postId,
    commentId
  });

  await notification.save();
}

async function deleteNotification(id) {
  await Notification.findByIdAndDelete(id);
}

module.exports = { createNotification, deleteNotification };

