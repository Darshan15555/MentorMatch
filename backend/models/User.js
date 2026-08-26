const mongoose = require('mongoose');
const { idTransform } = require('./plugins');
const { Schema } = mongoose;

const skillSchema = new Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['have', 'want'], required: true },
}, { _id: true });

const timelineEntrySchema = new Schema({
  year: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  sortOrder: { type: Number, default: 0 },
}, { _id: true, timestamps: false });

const savedResourceSchema = new Schema({
  resourceId: { type: Schema.Types.ObjectId, ref: 'Resource', required: true },
  savedAt: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['mentor', 'mentee', 'both'], default: 'mentee' },
  bio: { type: String, default: '' },
  yearBranch: { type: String, default: '' },
  githubUrl: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  avatarSeed: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  availabilityStatus: { type: String, enum: ['open', 'busy'], default: 'open' },
  isAdmin: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  mentorLevel: { type: String, default: 'New Mentor' },
  sessionCount: { type: Number, default: 0 },
  avgRating: { type: Number, default: 0 },

  skills: { type: [skillSchema], default: [] },
  interests: { type: [String], default: [] },
  timeline: { type: [timelineEntrySchema], default: [] },
  savedResources: { type: [savedResourceSchema], default: [] },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

userSchema.plugin(idTransform);
// Never leak the password hash in API responses
userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.passwordHash;
    return ret;
  },
});

userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
