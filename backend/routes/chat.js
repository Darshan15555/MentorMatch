const express = require('express');
const { Match, Room, Message } = require('../models/index');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

async function canAccessMatch(matchId, userId) {
  const m = await Match.findById(matchId);
  if (!m) return false;
  return m.mentorId.toString() === userId || m.menteeId.toString() === userId;
}

async function canAccessRoom(roomId, userId) {
  const room = await Room.findById(roomId);
  if (!room) return false;
  if (room.mentorId.toString() === userId) return true;
  return room.memberIds.some(id => id.toString() === userId);
}

router.get('/match/:matchId', requireAuth, async (req, res, next) => {
  try {
    if (!(await canAccessMatch(req.params.matchId, req.user.id))) {
      return res.status(403).json({ error: 'Not part of this connection' });
    }
    const messages = await Message.find({ matchId: req.params.matchId }).sort({ createdAt: 1 });
    res.json(messages.map(formatMessage));
  } catch (err) { next(err); }
});

router.get('/room/:roomId', requireAuth, async (req, res, next) => {
  try {
    if (!(await canAccessRoom(req.params.roomId, req.user.id))) {
      return res.status(403).json({ error: 'Not a member of this room' });
    }
    const messages = await Message.find({ roomId: req.params.roomId }).sort({ createdAt: 1 });
    res.json(messages.map(formatMessage));
  } catch (err) { next(err); }
});

function formatMessage(m) {
  const json = m.toJSON();
  json.match_id = m.matchId ? m.matchId.toString() : null;
  json.room_id = m.roomId ? m.roomId.toString() : null;
  json.sender_id = m.senderId.toString();
  json.sender_name = m.senderName;
  json.created_at = m.createdAt;
  return json;
}

module.exports = { router, canAccessMatch, canAccessRoom, formatMessage };
