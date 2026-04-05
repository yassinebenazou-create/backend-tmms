const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../utils/authMiddleware');
const requireRole = require('../utils/roleMiddleware');
const User = require('../models/User');
const UserFile = require('../models/UserFile');
const AccessRequest = require('../models/AccessRequest');
const ContactMessage = require('../models/ContactMessage');
const AuditLog = require('../models/AuditLog');
const ManagedFile = require('../models/ManagedFile');
const { nextPrefixedId } = require('../utils/id');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePhoto: user.profilePhoto || null,
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
    await logAudit({
      req,
      actor: { id: user.id, name: user.name, email: user.email, role: user.role },
      action: 'auth.signup',
      entityType: 'user',
      entityId: user.id,
      details: { email: user.email }
    });

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

    await logAudit({
      req,
      actor: { id: user.id, name: user.name, email: user.email, role: user.role },
      action: 'auth.signin',
      entityType: 'user',
      entityId: user.id,
      details: { email: user.email }
    });

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

router.patch('/me/profile-photo', authMiddleware, async (req, res) => {
  const { imageDataUrl = null } = req.body || {};
  const user = await User.findOne({ id: req.user.id });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  if (imageDataUrl !== null) {
    const isDataUrl = typeof imageDataUrl === 'string' && /^data:image\/(png|jpe?g|webp);base64,/i.test(imageDataUrl);
    if (!isDataUrl) {
      return res.status(400).json({ success: false, message: 'Invalid image format. Use PNG/JPG/WEBP.' });
    }

    // ~2.5MB limit to avoid oversized documents.
    if (imageDataUrl.length > 2_500_000) {
      return res.status(413).json({ success: false, message: 'Image too large. Please use a smaller file.' });
    }
  }

  user.profilePhoto = imageDataUrl;
  await user.save();

  await logAudit({
    req,
    action: imageDataUrl ? 'profile.photo.update' : 'profile.photo.remove',
    entityType: 'user',
    entityId: user.id,
    details: {}
  });

  return res.status(200).json({ success: true, user: sanitizeUser(user) });
});

router.get('/users', authMiddleware, requireRole('admin'), async (_req, res) => {
  const users = await User.find().lean();
  return res.status(200).json({ success: true, users: users.map(sanitizeUser) });
});

router.delete('/users/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const targetUserId = String(req.params.id || '').trim();
  if (!targetUserId) {
    return res.status(400).json({ success: false, message: 'User id is required.' });
  }

  if (req.user.id === targetUserId) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
  }

  const user = await User.findOne({ id: targetUserId });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  if (user.role === 'admin') {
    const adminsCount = await User.countDocuments({ role: 'admin' });
    if (adminsCount <= 1) {
      return res.status(400).json({ success: false, message: 'Cannot delete the last admin user.' });
    }
  }

  const [userFileDelete, requestDelete, messageDelete] = await Promise.all([
    UserFile.deleteMany({ user_id: targetUserId }),
    AccessRequest.deleteMany({ user_id: targetUserId }),
    ContactMessage.deleteMany({ user_id: targetUserId })
  ]);

  await User.deleteOne({ id: targetUserId });

  await logAudit({
    req,
    action: 'user.delete',
    entityType: 'user',
    entityId: targetUserId,
    details: {
      deletedUser: { name: user.name, email: user.email, role: user.role },
      cleaned: {
        userFileLinks: userFileDelete.deletedCount || 0,
        accessRequests: requestDelete.deletedCount || 0,
        contactMessages: messageDelete.deletedCount || 0
      }
    }
  });

  return res.status(200).json({
    success: true,
    message: 'User deleted successfully.',
    cleaned: {
      userFileLinks: userFileDelete.deletedCount || 0,
      accessRequests: requestDelete.deletedCount || 0,
      contactMessages: messageDelete.deletedCount || 0
    }
  });
});

router.post('/cleanup', authMiddleware, requireRole('admin'), async (req, res) => {
  const daysRaw = Number(req.body?.days ?? 90);
  const days = Number.isFinite(daysRaw) ? Math.max(1, Math.min(3650, daysRaw)) : 90;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [auditDelete, requestsDelete, messagesDelete] = await Promise.all([
    AuditLog.deleteMany({ created_at: { $lt: cutoff } }),
    AccessRequest.deleteMany({
      status: { $in: ['approved', 'rejected'] },
      updated_at: { $lt: cutoff }
    }),
    ContactMessage.deleteMany({
      status: 'read',
      created_at: { $lt: cutoff }
    })
  ]);

  const [existingUsers, existingFiles] = await Promise.all([
    User.find({}, { id: 1, _id: 0 }).lean(),
    ManagedFile.find({}, { id: 1, _id: 0 }).lean()
  ]);

  const validUserIds = new Set(existingUsers.map((u) => u.id));
  const validFileIds = new Set(existingFiles.map((f) => f.id));

  const links = await UserFile.find().lean();
  const orphanLinkIds = links
    .filter((link) => !validUserIds.has(link.user_id) || !validFileIds.has(link.file_id))
    .map((link) => link.id);

  let orphanLinksDeleted = 0;
  if (orphanLinkIds.length) {
    const result = await UserFile.deleteMany({ id: { $in: orphanLinkIds } });
    orphanLinksDeleted = result.deletedCount || 0;
  }

  await logAudit({
    req,
    action: 'database.cleanup',
    entityType: 'system',
    entityId: null,
    details: {
      days,
      cutoff: cutoff.toISOString(),
      removed: {
        auditLogs: auditDelete.deletedCount || 0,
        accessRequests: requestsDelete.deletedCount || 0,
        contactMessages: messagesDelete.deletedCount || 0,
        orphanUserFileLinks: orphanLinksDeleted
      }
    }
  });

  return res.status(200).json({
    success: true,
    message: `Cleanup completed for records older than ${days} days.`,
    removed: {
      auditLogs: auditDelete.deletedCount || 0,
      accessRequests: requestsDelete.deletedCount || 0,
      contactMessages: messagesDelete.deletedCount || 0,
      orphanUserFileLinks: orphanLinksDeleted
    }
  });
});

module.exports = router;
