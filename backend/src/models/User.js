const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Email inválido'] },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['user', 'critic', 'admin'], default: 'user' },
    isActive: { type: Boolean, default: true },
    avatar: { type: String, default: '' },
    bio: { type: String, maxlength: 300, default: '' },
    country: { type: String, default: '' },
    favoriteGenre: { type: String, default: '' },
    website: { type: String, default: '' },
    likedMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
    dislikedMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
    refreshTokens: [{ token: { type: String, required: true }, createdAt: { type: Date, default: Date.now } }],
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);