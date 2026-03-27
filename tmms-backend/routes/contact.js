const express = require('express');
const authMiddleware = require('../utils/authMiddleware');
const requireRole = require('../utils/roleMiddleware');
const ContactMessage = require('../models/ContactMessage');
const User = require('../models/User');
const { nextPrefixedId } = require('../utils/id');

const router = express.Router();

router.post('/messages', authMiddleware, async (req, res) => {
  const { name, email, subject, message } = req.body || {};

  if (!subject || !message) {
    return res.status(400).json({ success: false, message: 'Subject and message are required.' });
  }

  const dbUser = await User.findOne({ id: req.user.id }).lean();

  const created = await ContactMessage.create({
    id: nextPrefixedId('cm'),
    user_id: req.user.id,
    name: String(name || dbUser?.name || req.user.name || '').trim(),
    email: String(email || dbUser?.email || req.user.email || '').trim().toLowerCase(),
    subject: String(subject).trim(),
    message: String(message).trim(),
    status: 'unread',
    created_at: new Date()
  });

  return res.status(201).json({ success: true, message: created });
});

router.get('/messages', authMiddleware, requireRole('admin'), async (_req, res) => {
  const messages = await ContactMessage.find().sort({ created_at: -1 }).limit(100).lean();
  const userIds = [...new Set(messages.map((m) => m.user_id))];
  const users = await User.find({ id: { $in: userIds } }).lean();
  const userMap = new Map(users.map((u) => [u.id, u]));

  const enriched = messages.map((item) => ({
    ...item,
    user: userMap.get(item.user_id) || null
  }));

  return res.status(200).json({ success: true, messages: enriched });
});

router.patch('/messages/:id/read', authMiddleware, requireRole('admin'), async (req, res) => {
  const message = await ContactMessage.findOne({ id: req.params.id });

  if (!message) {
    return res.status(404).json({ success: false, message: 'Contact message not found.' });
  }

  if (message.status !== 'read') {
    message.status = 'read';
    message.read_at = new Date();
    await message.save();
  }

  return res.status(200).json({ success: true, message });
});

module.exports = router;
