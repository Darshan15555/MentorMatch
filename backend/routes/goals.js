const express = require('express');
const { Goal, Match } = require('../models/index');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

async function partOfMatch(matchId, userId) {
  const m = await Match.findById(matchId);
  if (!m) return null;
  if (m.mentorId.toString() !== userId && m.menteeId.toString() !== userId) return null;
  return m;
}

function enrichGoal(goal) {
  const json = goal.toJSON();
  const items = goal.items.map(i => ({ id: i._id.toString(), content: i.content, is_done: i.isDone, done_at: i.doneAt }));
  const total = items.length;
  const done = items.filter(i => i.is_done).length;
  const progress = total ? Math.round((done / total) * 100) : 0;

  const lastActivity = items.reduce((latest, i) => (i.done_at && i.done_at > latest ? i.done_at : latest), goal.createdAt);
  const daysSinceActivity = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24);
  const needsNudge = daysSinceActivity >= 7 && progress < 100;

  json.match_id = goal.matchId.toString();
  json.created_at = goal.createdAt;
  json.items = items;
  json.progress = progress;
  json.needsNudge = needsNudge;
  json.daysSinceActivity = Math.round(daysSinceActivity);
  return json;
}

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { match_id, title, items } = req.body;
    if (!match_id || !title) return res.status(400).json({ error: 'match_id and title are required' });
    if (!(await partOfMatch(match_id, req.user.id))) return res.status(403).json({ error: 'Not part of this connection' });

    const goal = await Goal.create({
      matchId: match_id, title, createdBy: req.user.id,
      items: Array.isArray(items) ? items.map(content => ({ content })) : [],
    });
    res.status(201).json(enrichGoal(goal));
  } catch (err) { next(err); }
});

router.get('/match/:matchId', requireAuth, async (req, res, next) => {
  try {
    if (!(await partOfMatch(req.params.matchId, req.user.id))) return res.status(403).json({ error: 'Not part of this connection' });
    const goals = await Goal.find({ matchId: req.params.matchId }).sort({ createdAt: -1 });
    res.json(goals.map(enrichGoal));
  } catch (err) { next(err); }
});

router.post('/:goalId/items', requireAuth, async (req, res, next) => {
  try {
    const { content } = req.body;
    const goal = await Goal.findById(req.params.goalId);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    if (!(await partOfMatch(goal.matchId, req.user.id))) return res.status(403).json({ error: 'Not part of this connection' });
    goal.items.push({ content });
    await goal.save();
    res.status(201).json(enrichGoal(goal));
  } catch (err) { next(err); }
});

router.patch('/items/:itemId', requireAuth, async (req, res, next) => {
  try {
    const { is_done } = req.body;
    const goal = await Goal.findOne({ 'items._id': req.params.itemId });
    if (!goal) return res.status(404).json({ error: 'Item not found' });
    if (!(await partOfMatch(goal.matchId, req.user.id))) return res.status(403).json({ error: 'Not part of this connection' });

    const item = goal.items.id(req.params.itemId);
    item.isDone = !!is_done;
    item.doneAt = is_done ? new Date() : null;
    await goal.save();

    const enriched = enrichGoal(goal);
    res.json({ ...enriched, milestone_just_completed: !!is_done });
  } catch (err) { next(err); }
});

module.exports = router;
