const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../utils/authMiddleware');
const requireRole = require('../utils/roleMiddleware');
const User = require('../models/User');
const { nextPrefixedId } = require('../utils/id');

const router = express.Router();

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.created_at
  };
}

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    process.env.JWT_SECRET || 'change_this_to_long_random_string',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail }).lean();

    if (exists) {
      return res.status(409).json({ success: false, message: 'Email already exists.' });
    }

    const user = new User({
      id: nextPrefixedId('u'),
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'user',
      created_at: new Date()
    });

    await user.save();

    const token = signToken(user);
    return res.status(201).json({ success: true, token, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Signup failed.' });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = signToken(user);
    return res.status(200).json({ success: true, token, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Signin failed.' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  const user = await User.findOne({ id: req.user.id }).lean();
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  return res.status(200).json({ success: true, user: sanitizeUser(user) });
});

router.get('/users', authMiddleware, requireRole('admin'), async (_req, res) => {
  const users = await User.find().lean();
  return res.status(200).json({ success: true, users: users.map(sanitizeUser) });
});

module.exports = router;
