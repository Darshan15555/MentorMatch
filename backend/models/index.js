const mongoose = require('mongoose');
const { idTransform } = require('./plugins');
const { Schema } = mongoose;

// ---------------- Resource ----------------
const resourceSchema = new Schema({
  mentorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  link: { type: String, required: true },
  notes: { type: String, default: '' },
  tags: { type: [String], default: [] },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });
resourceSchema.plugin(idTransform);
const Resource = mongoose.model('Resource', resourceSchema);

// ---------------- Match (connection request) ----------------
const matchSchema = new Schema({
  mentorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  menteeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  matchScore: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'archived'], default: 'pending' },
  introMessage: { type: String, default: '' },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });
matchSchema.index({ mentorId: 1, menteeId: 1 }, { unique: true });
matchSchema.plugin(idTransform);
const Match = mongoose.model('Match', matchSchema);

// ---------------- Message ----------------
const messageSchema = new Schema({
  matchId: { type: Schema.Types.ObjectId, ref: 'Match', default: null },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', default: null },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true }, // denormalized for fast reads
  content: { type: String, required: true },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });
messageSchema.index({ matchId: 1, createdAt: 1 });
messageSchema.index({ roomId: 1, createdAt: 1 });
messageSchema.plugin(idTransform);
const Message = mongoose.model('Message', messageSchema);

// ---------------- Goal (shared checklist) ----------------
const goalItemSchema = new Schema({
  content: { type: String, required: true },
  isDone: { type: Boolean, default: false },
  doneAt: { type: Date, default: null },
}, { _id: true });

const goalSchema = new Schema({
  matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
  title: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: { type: [goalItemSchema], default: [] },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });
goalSchema.plugin(idTransform);
const Goal = mongoose.model('Goal', goalSchema);

// ---------------- Room (group mentorship) ----------------
const roomSchema = new Schema({
  mentorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true },
  description: { type: String, default: '' },
  recurringDay: { type: String, default: '' },
  recurringTime: { type: String, default: '' },
  memberIds: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });
roomSchema.plugin(idTransform);
const Room = mongoose.model('Room', roomSchema);

// ---------------- Feedback ----------------
const feedbackSchema = new Schema({
  matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
  fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fromName: { type: String, required: true },
  toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: '' },
  endorsement: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });
feedbackSchema.plugin(idTransform);
const Feedback = mongoose.model('Feedback', feedbackSchema);

// ---------------- Session notes (private, mentor-only) ----------------
const sessionNoteSchema = new Schema({
  mentorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  menteeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  noteText: { type: String, required: true },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });
sessionNoteSchema.plugin(idTransform);
const SessionNote = mongoose.model('SessionNote', sessionNoteSchema);

// ---------------- Report (moderation) ----------------
const reportSchema = new Schema({
  reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reporterName: { type: String, required: true },
  reportedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reportedName: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['open', 'reviewed', 'dismissed'], default: 'open' },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });
reportSchema.plugin(idTransform);
const Report = mongoose.model('Report', reportSchema);

module.exports = { Resource, Match, Message, Goal, Room, Feedback, SessionNote, Report };
