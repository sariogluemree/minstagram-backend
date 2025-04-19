const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Postu atan kişi
  imageUrl: { type: String, required: true }, // Cloudinary URL'si
  caption: { type: String, default: "" },
  tags:
    [{
      taggedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      position: { x: Number, y: Number }
    }],
  createdAt: { type: Date, default: Date.now }
}, { collection: "posts" });

module.exports = mongoose.model('Post', PostSchema);
