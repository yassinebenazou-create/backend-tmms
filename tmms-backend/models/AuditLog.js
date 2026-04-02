const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    actor_id: { type: String, default: null, index: true },
    actor_name: { type: String, default: 'System' },
    actor_email: { type: String, default: null, index: true },
    actor_role: { type: String, default: null, index: true },
    action: { type: String, required: true, index: true },
    entity_type: { type: String, required: true, index: true },
    entity_id: { type: String, default: null, index: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: null },
    user_agent: { type: String, default: null },
    created_at: { type: Date, default: Date.now, index: true }
  },
  { versionKey: false }
);

module.exports = mongoose.model('AuditLog', AuditLogSchema);
