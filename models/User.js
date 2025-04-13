const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePhoto: { type: String, default: "" }, // Cloudinary URL'si olacak
  name: { type: String, default: "" },
  bio: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
}, { collection: "users" });

UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch(err) {
      next(err);
    }
});

UserSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    username: this.username,
    profilePhoto: this.profilePhoto,
    name: this.name,
    bio: this.bio
  };
};

UserSchema.methods.getPostProfile = function() {
  return {
    _id: this._id,
    username: this.username,
    profilePhoto: this.profilePhoto,
  };
};

module.exports = mongoose.model('User', UserSchema);
