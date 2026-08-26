const express = require('express');
const { Report, Match, Message, Room } = require('../models/index');
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/reports', requireAuth, async (req, res, next) => {
  try {
    const { reported_user_id, reason } = req.body;
    if (!reported_user_id || !reason) return res.status(400).json({ error: 'reported_user_id and reason are required' });
    const [reporter, reported] = await Promise.all([User.findById(req.user.id), User.findById(reported_user_id)]);
    if (!reported) return res.status(404).json({ error: 'Reported user not found' });
    const report = await Report.create({
      reporterId: req.user.id, reporterName: reporter.name,
      reportedUserId: reported_user_id, reportedName: reported.name, reason,
    });
    res.status(201).json(report.toJSON());
  } catch (err) { next(err); }
});

router.use(requireAuth, requireAdmin);

router.get('/reports', async (req, res, next) => {
  try {
    const rows = await Report.find().sort({ createdAt: -1 });
    res.json(rows.map(r => {
      const json = r.toJSON();
      json.reporter_name = r.reporterName;
      json.reported_name = r.reportedName;
      json.reported_user_id = r.reportedUserId.toString();
      json.created_at = r.createdAt;
      return json;
    }));
  } catch (err) { next(err); }
});

router.patch('/reports/:id', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['open', 'reviewed', 'dismissed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(report.toJSON());
  } catch (err) { next(err); }
});

router.get('/users/unverified', async (req, res, next) => {
  try {
    const users = await User.find({ isVerified: false, isBanned: false }).sort({ createdAt: -1 }).limit(50);
    res.json(users.map(u => u.toJSON()));
  } catch (err) { next(err); }
});

router.patch('/users/:id/verify', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
    res.json(user.toJSON());
  } catch (err) { next(err); }
});

router.patch('/users/:id/ban', async (req, res, next) => {
  try {
    const { banned } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned: !!banned }, { new: true });
    res.json(user.toJSON());
  } catch (err) { next(err); }
});

router.get('/stats', async (req, res, next) => {
  try {
    const [userCount, mentorCount, menteeCount, matchCount, acceptedMatches, messageCount, roomCount, openReports] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: { $in: ['mentor', 'both'] } }),
      User.countDocuments({ role: { $in: ['mentee', 'both'] } }),
      Match.countDocuments(),
      Match.countDocuments({ status: 'accepted' }),
      Message.countDocuments(),
      Room.countDocuments(),
      Report.countDocuments({ status: 'open' }),
    ]);
    res.json({ userCount, mentorCount, menteeCount, matchCount, acceptedMatches, messageCount, roomCount, openReports });
  } catch (err) { next(err); }
});

module.exports = router;
