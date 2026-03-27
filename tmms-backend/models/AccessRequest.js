const mongoose = require('mongoose');

const AccessRequestSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    user_id: { type: String, required: true, index: true },
    file_id: { type: String, required: true, index: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    created_at: { type: Date, default: Date.now, index: true },
    updated_at: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

module.exports = mongoose.model('AccessRequest', AccessRequestSchema);
