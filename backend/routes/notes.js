const express = require('express');
const { SessionNote } = require('../models/index');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { mentee_id, note_text } = req.body;
    if (!mentee_id || !note_text) return res.status(400).json({ error: 'mentee_id and note_text are required' });
    const note = await SessionNote.create({ mentorId: req.user.id, menteeId: mentee_id, noteText: note_text });
    res.status(201).json(note.toJSON());
  } catch (err) { next(err); }
});

router.get('/mentee/:menteeId', requireAuth, async (req, res, next) => {
  try {
    const notes = await SessionNote.find({ mentorId: req.user.id, menteeId: req.params.menteeId }).sort({ createdAt: -1 });
    res.json(notes.map(n => {
      const json = n.toJSON();
      json.note_text = n.noteText;
      json.created_at = n.createdAt;
      return json;
    }));
  } catch (err) { next(err); }
});

module.exports = router;
