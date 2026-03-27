const mongoose = require('mongoose');

const ManagedFileSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    original_name: { type: String, default: null },
    path: { type: String, default: null },
    mime_type: { type: String, default: null },
    type: { type: String, enum: ['file', 'powerbi'], required: true, index: true },
    powerbi_url: { type: String, default: null },
    created_at: { type: Date, default: Date.now, index: true },
    created_by: { type: String, required: true, index: true }
  },
  { versionKey: false }
);

module.exports = mongoose.model('ManagedFile', ManagedFileSchema);
