const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { nextPrefixedId } = require('./id');

async function ensureAdminSeed() {
  const existing = await User.findOne({ email: 'admin@tmms.com' }).lean();
  if (existing) return;

  const admin = new User({
    id: nextPrefixedId('u'),
    name: 'TMMS Admin',
    email: 'admin@tmms.com',
    passwordHash: await bcrypt.hash('Admin@123', 10),
    role: 'admin',
    created_at: new Date()
  });

  await admin.save();
}

module.exports = {
  ensureAdminSeed
};
