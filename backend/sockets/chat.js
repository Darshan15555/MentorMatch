const jwt = require('jsonwebtoken');
const { Message } = require('../models/index');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');
const { canAccessMatch, canAccessRoom, formatMessage } = require('../routes/chat');

function initChatSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Missing auth token'));
    try {
      socket.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;

    socket.on('join', async ({ matchId, roomId }, ack) => {
      try {
        if (matchId) {
          if (!(await canAccessMatch(matchId, userId))) return ack?.({ error: 'Access denied to this connection' });
          socket.join(`match:${matchId}`);
          return ack?.({ ok: true });
        }
        if (roomId) {
          if (!(await canAccessRoom(roomId, userId))) return ack?.({ error: 'Access denied to this room' });
          socket.join(`room:${roomId}`);
          return ack?.({ ok: true });
        }
        ack?.({ error: 'matchId or roomId required' });
      } catch (err) { ack?.({ error: 'Server error' }); }
    });

    socket.on('typing', ({ matchId, roomId }) => {
      const channel = matchId ? `match:${matchId}` : `room:${roomId}`;
      socket.to(channel).emit('typing', { userId, matchId, roomId });
    });

    socket.on('message', async ({ matchId, roomId, content }, ack) => {
      try {
        if (!content || !content.trim()) return ack?.({ error: 'Empty message' });
        let allowed = false;
        let channel = '';
        if (matchId) {
          allowed = await canAccessMatch(matchId, userId);
          channel = `match:${matchId}`;
        } else if (roomId) {
          allowed = await canAccessRoom(roomId, userId);
          channel = `room:${roomId}`;
        }
        if (!allowed) return ack?.({ error: 'Access denied' });

        const sender = await User.findById(userId);
        const doc = await Message.create({
          matchId: matchId || null, roomId: roomId || null,
          senderId: userId, senderName: sender.name, content: content.trim(),
        });
        const message = formatMessage(doc);
        io.to(channel).emit('message', message);
        ack?.({ ok: true, message });
      } catch (err) { ack?.({ error: 'Server error' }); }
    });

    socket.on('disconnect', () => { /* no-op; presence tracking could be added later */ });
  });
}

module.exports = { initChatSocket };
