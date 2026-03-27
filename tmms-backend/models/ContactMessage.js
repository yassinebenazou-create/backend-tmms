const mongoose = require('mongoose');

const ContactMessageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    user_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['unread', 'read'], default: 'unread', index: true },
    created_at: { type: Date, default: Date.now, index: true },
    read_at: { type: Date, default: null }
  },
  { versionKey: false }
);

module.exports = mongoose.model('ContactMessage', ContactMessageSchema);
