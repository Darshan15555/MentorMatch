require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./db/mongo');

const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const matchesRouter = require('./routes/matches');
const { router: chatRouter } = require('./routes/chat');
const goalsRouter = require('./routes/goals');
const resourcesRouter = require('./routes/resources');
const roomsRouter = require('./routes/rooms');
const feedbackRouter = require('./routes/feedback');
const notesRouter = require('./routes/notes');
const adminRouter = require('./routes/admin');
const { initChatSocket } = require('./sockets/chat');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/chat', chatRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/notes', notesRouter);
app.use('/api/admin', adminRouter);

app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found' }));

initChatSocket(io);

// Serve the React production build
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('/{*splat}', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Central error handler (catches anything unhandled thrown in routes)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Mentor platform backend running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

module.exports = { app, server, io };
