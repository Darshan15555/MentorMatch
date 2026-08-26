const express = require('express');
const { Feedback, Match } = require('../models/index');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function levelForStats(sessionCount, avgRating) {
  if (sessionCount >= 25 && avgRating >= 4.5) return 'Top Mentor';
  if (sessionCount >= 10 && avgRating >= 4.0) return 'Trusted Mentor';
  if (sessionCount >= 3) return 'Rising Mentor';
  return 'New Mentor';
}

async function recomputeMentorStats(mentorId) {
  const rows = await Feedback.find({ toUserId: mentorId });
  const sessionCount = rows.length;
  const avgRating = sessionCount ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / sessionCount) * 10) / 10 : 0;
  const level = levelForStats(sessionCount, avgRating);
  await User.findByIdAndUpdate(mentorId, { sessionCount, avgRating, mentorLevel: level });
  return { sessionCount, avgRating, level };
}

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { match_id, rating, comment, endorsement } = req.body;
    if (!match_id || !rating) return res.status(400).json({ error: 'match_id and rating are required' });
    const m = await Match.findById(match_id);
    if (!m) return res.status(404).json({ error: 'Match not found' });
    if (m.mentorId.toString() !== req.user.id && m.menteeId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not part of this connection' });
    }
    const toUser = req.user.id === m.menteeId.toString() ? m.mentorId.toString() : m.menteeId.toString();
    const me = await User.findById(req.user.id);

    const feedback = await Feedback.create({
      matchId: match_id, fromUserId: req.user.id, fromName: me.name, toUserId: toUser,
      rating, comment: comment || '', endorsement: !!endorsement,
    });

    const toUserRow = await User.findById(toUser, 'role');
    let stats = null;
    if (toUserRow && (toUserRow.role === 'mentor' || toUserRow.role === 'both')) {
      stats = await recomputeMentorStats(toUser);
    }
    res.status(201).json({ feedback: feedback.toJSON(), mentorStats: stats });
  } catch (err) { next(err); }
});

router.get('/user/:userId', requireAuth, async (req, res, next) => {
  try {
    const rows = await Feedback.find({ toUserId: req.params.userId }).sort({ createdAt: -1 });
    res.json(rows.map(f => {
      const json = f.toJSON();
      json.from_name = f.fromName;
      json.created_at = f.createdAt;
      return json;
    }));
  } catch (err) { next(err); }
});

module.exports = router;
