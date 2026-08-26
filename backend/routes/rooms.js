const express = require('express');
const { Room } = require('../models/index');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

async function enrichRoom(room) {
  const memberUsers = await User.find({ _id: { $in: room.memberIds } }, 'name avatarSeed');
  const mentor = await User.findById(room.mentorId, 'name avatarSeed');
  const json = room.toJSON();
  json.mentor_id = room.mentorId.toString();
  json.recurring_day = room.recurringDay;
  json.recurring_time = room.recurringTime;
  json.created_at = room.createdAt;
  json.mentor = mentor ? { id: mentor._id.toString(), name: mentor.name, avatar_seed: mentor.avatarSeed } : null;
  json.members = memberUsers.map(m => ({ id: m._id.toString(), name: m.name, avatar_seed: m.avatarSeed }));
  json.member_count = json.members.length;
  return json;
}

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { topic, description, recurring_day, recurring_time } = req.body;
    if (!topic) return res.status(400).json({ error: 'topic is required' });
    const room = await Room.create({
      mentorId: req.user.id, topic, description: description || '',
      recurringDay: recurring_day || '', recurringTime: recurring_time || '',
      memberIds: [req.user.id], // mentor is automatically a member of their own room
    });
    res.status(201).json(await enrichRoom(room));
  } catch (err) { next(err); }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const rooms = await Room.find().sort({ createdAt: -1 });
    res.json(await Promise.all(rooms.map(enrichRoom)));
  } catch (err) { next(err); }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(await enrichRoom(room));
  } catch (err) { next(err); }
});

router.post('/:id/join', requireAuth, async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (!room.memberIds.some(id => id.toString() === req.user.id)) {
      room.memberIds.push(req.user.id);
      await room.save();
    }
    res.status(201).json(await enrichRoom(room));
  } catch (err) { next(err); }
});

router.post('/:id/leave', requireAuth, async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    room.memberIds = room.memberIds.filter(id => id.toString() !== req.user.id);
    await room.save();
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
