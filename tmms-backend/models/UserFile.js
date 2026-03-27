const mongoose = require('mongoose');

const UserFileSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    user_id: { type: String, required: true, index: true },
    file_id: { type: String, required: true, index: true },
    created_at: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

UserFileSchema.index({ user_id: 1, file_id: 1 }, { unique: true });

module.exports = mongoose.model('UserFile', UserFileSchema);
