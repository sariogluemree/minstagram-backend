const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  userId: { type: String, ref: 'User', required: true }, // Postu atan kişi
  imageUrl: { type: String, required: true }, // Cloudinary URL'si
  caption: { type: String, default: "" },
  tags: { type: [String], default: []},
  createdAt: { type: Date, default: Date.now }
}, { collection: "posts" });

module.exports = mongoose.model('Post', PostSchema);
