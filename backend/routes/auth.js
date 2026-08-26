const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

const VERIFIED_DOMAINS = (process.env.VERIFIED_DOMAINS || 'college.edu,university.edu,student.ac.in')
  .split(',').map(d => d.trim().toLowerCase());

function isCollegeEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  return VERIFIED_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
}

function signToken(user) {
  return jwt.sign({
    id: user._id.toString(), name: user.name, email: user.email,
    role: user.role, is_admin: !!user.isAdmin
  }, JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const verified = isCollegeEmail(email);
    const finalRole = ['mentor', 'mentee', 'both'].includes(role) ? role : 'mentee';

    const user = await User.create({
      name, email: email.toLowerCase(), passwordHash, role: finalRole,
      isVerified: verified, avatarSeed: Math.random().toString(36).slice(2, 10),
    });

    const token = signToken(user);
    res.status(201).json({ token, user: user.toJSON() });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (user.isBanned) {
      return res.status(403).json({ error: 'This account has been suspended' });
    }
    const token = signToken(user);
    res.json({ token, user: user.toJSON() });
  } catch (err) { next(err); }
});

module.exports = router;
