const express = require('express');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { computeMatch, splitSkills } = require('../utils/matching');

const router = express.Router();

function skillSetsFor(user) { return splitSkills(user.skills); }

// ---- Profile ----
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const json = user.toJSON();
    json.skills = skillSetsFor(user);
    json.skillsDetailed = user.skills.map(s => ({ id: s._id.toString(), name: s.name, type: s.type }));
    res.json(json);
  } catch (err) { next(err); }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const json = user.toJSON();
    json.skills = skillSetsFor(user);
    res.json(json);
  } catch (err) { next(err); }
});

router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const { bio, year_branch, github_url, linkedin_url, role } = req.body;
    const update = {};
    if (bio !== undefined) update.bio = bio;
    if (year_branch !== undefined) update.yearBranch = year_branch;
    if (github_url !== undefined) update.githubUrl = github_url;
    if (linkedin_url !== undefined) update.linkedinUrl = linkedin_url;
    if (role !== undefined) update.role = role;
    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true });
    const json = user.toJSON();
    json.skills = skillSetsFor(user);
    res.json(json);
  } catch (err) { next(err); }
});

router.patch('/me/availability', requireAuth, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['open', 'busy'].includes(status)) {
      return res.status(400).json({ error: "status must be 'open' or 'busy'" });
    }
    await User.findByIdAndUpdate(req.user.id, { availabilityStatus: status });
    res.json({ availability_status: status });
  } catch (err) { next(err); }
});

// ---- Skills (have / want-to-learn) — embedded subdocuments on User ----
router.post('/me/skills', requireAuth, async (req, res, next) => {
  try {
    const { skill_name, type } = req.body;
    if (!skill_name || !['have', 'want'].includes(type)) {
      return res.status(400).json({ error: "skill_name and type ('have' or 'want') are required" });
    }
    const user = await User.findById(req.user.id);
    const already = user.skills.some(s => s.name.toLowerCase() === skill_name.trim().toLowerCase() && s.type === type);
    if (!already) {
      user.skills.push({ name: skill_name.trim(), type });
      await user.save();
    }
    res.status(201).json(skillSetsFor(user));
  } catch (err) { next(err); }
});

router.delete('/me/skills/:skillId/:type', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    user.skills = user.skills.filter(s => !(s._id.toString() === req.params.skillId && s.type === req.params.type));
    await user.save();
    res.json(skillSetsFor(user));
  } catch (err) { next(err); }
});

// Lookup helper the frontend uses to resolve a skill's subdocument id by name
router.get('/me/skills/lookup', requireAuth, async (req, res, next) => {
  try {
    const { name, type } = req.query;
    const user = await User.findById(req.user.id);
    const skill = user.skills.find(s => s.name.toLowerCase() === (name || '').toLowerCase() && s.type === type);
    res.json(skill ? { id: skill._id.toString(), name: skill.name, type: skill.type } : null);
  } catch (err) { next(err); }
});

// ---- Interests ----
router.post('/me/interests', requireAuth, async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const user = await User.findById(req.user.id);
    if (!user.interests.some(i => i.toLowerCase() === name.trim().toLowerCase())) {
      user.interests.push(name.trim());
      await user.save();
    }
    res.status(201).json(user.interests);
  } catch (err) { next(err); }
});

router.delete('/me/interests/:name', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    user.interests = user.interests.filter(i => i.toLowerCase() !== req.params.name.toLowerCase());
    await user.save();
    res.json(user.interests);
  } catch (err) { next(err); }
});

// ---- Career path timeline (mentor) ----
router.post('/me/timeline', requireAuth, async (req, res, next) => {
  try {
    const { year, title, description, sort_order } = req.body;
    if (!year || !title) return res.status(400).json({ error: 'year and title are required' });
    const user = await User.findById(req.user.id);
    user.timeline.push({ year, title, description: description || '', sortOrder: sort_order || 0 });
    await user.save();
    res.status(201).json(user.timeline[user.timeline.length - 1]);
  } catch (err) { next(err); }
});

router.delete('/me/timeline/:entryId', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    user.timeline = user.timeline.filter(t => t._id.toString() !== req.params.entryId);
    await user.save();
    res.status(204).end();
  } catch (err) { next(err); }
});

// ---- Journey stats: a mentee's visible progress across all connections ----
router.get('/me/journey', requireAuth, async (req, res, next) => {
  try {
    const { Match, Goal, Feedback } = require('../models/index');
    const userId = req.user.id;

    const matches = await Match.find({
      $or: [{ mentorId: userId }, { menteeId: userId }],
      status: 'accepted',
    });
    const matchIds = matches.map(m => m._id);

    const goals = await Goal.find({ matchId: { $in: matchIds } });
    let milestonesCompleted = 0;
    let milestonesTotal = 0;
    const skillsInProgress = new Set();
    goals.forEach(g => {
      milestonesTotal += g.items.length;
      milestonesCompleted += g.items.filter(i => i.isDone).length;
      skillsInProgress.add(g.title);
    });

    const feedbackGiven = await Feedback.countDocuments({ fromUserId: userId });

    res.json({
      connectionsCount: matches.length,
      milestonesCompleted,
      milestonesTotal,
      goalsInProgress: goals.filter(g => g.items.some(i => !i.isDone)).length,
      sessionsRated: feedbackGiven,
    });
  } catch (err) { next(err); }
});

// ---- Browse mentors with match scoring ----
router.get('/browse/mentors', requireAuth, async (req, res, next) => {
  try {
    const { skill, availability, q } = req.query;
    const query = { _id: { $ne: req.user.id }, role: { $in: ['mentor', 'both'] }, isBanned: false };
    if (availability) query.availabilityStatus = availability;
    if (q) {
      const re = new RegExp(q, 'i');
      query.$or = [{ name: re }, { bio: re }];
    }
    if (skill) {
      query.skills = { $elemMatch: { name: new RegExp(skill, 'i'), type: 'have' } };
    }
    const mentors = await User.find(query);
    const me = await User.findById(req.user.id);

    const results = mentors.map(m => {
      const match = computeMatch(me, m);
      const json = m.toJSON();
      return {
        mentor: json,
        matchScore: match.score,
        explanation: match.explanation,
        skillGraph: match.skillGraph,
        breakdown: match.breakdown,
      };
    }).sort((a, b) => b.matchScore - a.matchScore);

    res.json(results);
  } catch (err) { next(err); }
});

router.get('/:id/match', requireAuth, async (req, res, next) => {
  try {
    const [me, other] = await Promise.all([User.findById(req.user.id), User.findById(req.params.id)]);
    if (!other) return res.status(404).json({ error: 'User not found' });
    res.json(computeMatch(me, other));
  } catch (err) { next(err); }
});

module.exports = router;
