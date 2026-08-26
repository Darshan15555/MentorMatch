const express = require('express');
const User = require('../models/User');
const { Match } = require('../models/index');
const { requireAuth } = require('../middleware/auth');
const { computeMatch } = require('../utils/matching');

const router = express.Router();

async function enrichMatch(m) {
  const [mentor, mentee] = await Promise.all([User.findById(m.mentorId), User.findById(m.menteeId)]);
  const json = m.toJSON();
  json.mentor_id = m.mentorId.toString();
  json.mentee_id = m.menteeId.toString();
  json.match_score = m.matchScore;
  json.intro_message = m.introMessage;
  json.created_at = m.createdAt;
  json.mentor = mentor ? mentor.toJSON() : null;
  json.mentee = mentee ? mentee.toJSON() : null;
  return json;
}

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { mentor_id, intro_message } = req.body;
    if (!mentor_id) return res.status(400).json({ error: 'mentor_id is required' });
    if (mentor_id === req.user.id) return res.status(400).json({ error: 'Cannot connect with yourself' });

    const mentor = await User.findById(mentor_id);
    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });

    const existing = await Match.findOne({ mentorId: mentor_id, menteeId: req.user.id });
    if (existing) return res.status(409).json({ error: 'A connection request already exists', match: await enrichMatch(existing) });

    const me = await User.findById(req.user.id);
    const { score } = computeMatch(me, mentor);

    const match = await Match.create({
      mentorId: mentor_id, menteeId: req.user.id, matchScore: score,
      status: 'pending', introMessage: intro_message || '',
    });
    res.status(201).json(await enrichMatch(match));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'A connection request already exists' });
    next(err);
  }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { $or: [{ mentorId: req.user.id }, { menteeId: req.user.id }] };
    if (status) query.status = status;
    const rows = await Match.find(query).sort({ createdAt: -1 });
    res.json(await Promise.all(rows.map(enrichMatch)));
  } catch (err) { next(err); }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const m = await Match.findById(req.params.id);
    if (!m) return res.status(404).json({ error: 'Match not found' });
    if (m.mentorId.toString() !== req.user.id && m.menteeId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not part of this connection' });
    }
    res.json(await enrichMatch(m));
  } catch (err) { next(err); }
});

router.patch('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'declined', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const m = await Match.findById(req.params.id);
    if (!m) return res.status(404).json({ error: 'Match not found' });

    if ((status === 'accepted' || status === 'declined') && m.mentorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only the mentor can accept or decline a request' });
    }
    if (status === 'archived' && m.mentorId.toString() !== req.user.id && m.menteeId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not part of this connection' });
    }

    m.status = status;
    await m.save();
    res.json(await enrichMatch(m));
  } catch (err) { next(err); }
});

module.exports = router;
