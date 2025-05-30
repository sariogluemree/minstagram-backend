const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const verifyToken = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  console.log("GET NOTIFICATIONS");
  const userId = req.user.id;

  const notifications = await Notification.find({ recipientId: userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .select('-recipientId')
    .populate('senderId', 'username profilePhoto') // UI için gerekli olabilir
    .populate({
      path: 'commentId',
      populate: {
        path: 'userId', // yorumun sahibini de populate et
        select: 'username profilePhoto'
      }
    });;

  console.log(notifications);
  res.json(notifications);
});

router.post('/seen/:id', verifyToken, async (req, res) => {
  console.log("MARK AS SEEN");
  const { id } = req.params;
  const userId = req.user.id;

  await Notification.updateOne(
    { _id: id, recipientId: userId },
    { $set: { seen: true } }
  );

  res.send({ success: true });
});

router.get('/has-unseen', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const hasUnseen = await Notification.exists({ recipientId: userId, seen: false });
    res.json({ hasUnseen: !!hasUnseen });
  } catch (error) {
    console.error("Error checking unseen notifications:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
