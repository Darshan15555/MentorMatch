const express = require('express');
const { Resource } = require('../models/index');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function enrichResource(r) {
  const json = r.toJSON();
  json.mentor_id = r.mentorId.toString();
  json.created_at = r.createdAt;
  json.tags = (r.tags || []).map(name => ({ id: name.toLowerCase(), name }));
  return json;
}

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { title, link, notes, skill_names } = req.body;
    if (!title || !link) return res.status(400).json({ error: 'title and link are required' });
    const resource = await Resource.create({
      mentorId: req.user.id, title, link, notes: notes || '',
      tags: (skill_names || []).map(s => s.trim()).filter(Boolean),
    });
    res.status(201).json(enrichResource(resource));
  } catch (err) { next(err); }
});

router.get('/mentor/:mentorId', requireAuth, async (req, res, next) => {
  try {
    const resources = await Resource.find({ mentorId: req.params.mentorId }).sort({ createdAt: -1 });
    res.json(resources.map(enrichResource));
  } catch (err) { next(err); }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await Resource.deleteOne({ _id: req.params.id, mentorId: req.user.id });
    res.status(204).end();
  } catch (err) { next(err); }
});

router.post('/:id/save', requireAuth, async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    const user = await User.findById(req.user.id);
    if (!user.savedResources.some(sr => sr.resourceId.toString() === req.params.id)) {
      user.savedResources.push({ resourceId: req.params.id });
      await user.save();
    }
    res.status(201).json({ saved: true });
  } catch (err) { next(err); }
});

router.delete('/:id/save', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    user.savedResources = user.savedResources.filter(sr => sr.resourceId.toString() !== req.params.id);
    await user.save();
    res.status(204).end();
  } catch (err) { next(err); }
});

router.get('/me/library', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const resourceIds = user.savedResources.map(sr => sr.resourceId);
    const resources = await Resource.find({ _id: { $in: resourceIds } });
    const mentorIds = [...new Set(resources.map(r => r.mentorId.toString()))];
    const mentors = await User.find({ _id: { $in: mentorIds } });
    const mentorNameById = Object.fromEntries(mentors.map(m => [m._id.toString(), m.name]));

    const enriched = resources.map(r => {
      const json = enrichResource(r);
      json.mentor_name = mentorNameById[r.mentorId.toString()] || 'Unknown mentor';
      return json;
    });
    // preserve save order, most recent first
    const orderMap = Object.fromEntries(user.savedResources.map(sr => [sr.resourceId.toString(), sr.savedAt]));
    enriched.sort((a, b) => new Date(orderMap[b.id]) - new Date(orderMap[a.id]));
    res.json(enriched);
  } catch (err) { next(err); }
});

module.exports = router;
