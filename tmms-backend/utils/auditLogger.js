const AuditLog = require('../models/AuditLog');
const { nextPrefixedId } = require('./id');

function getRequestIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')?.[0]?.trim() ||
    req.ip ||
    req.connection?.remoteAddress ||
    null
  );
}

function getActor(req, actorOverride = null) {
  if (actorOverride) {
    return {
      id: actorOverride.id || null,
      name: actorOverride.name || 'System',
      email: actorOverride.email || null,
      role: actorOverride.role || null
    };
  }

  const user = req.user || {};
  return {
    id: user.id || null,
    name: user.name || 'System',
    email: user.email || null,
    role: user.role || null
  };
}

async function logAudit({
  req,
  action,
  entityType,
  entityId = null,
  details = {},
  actor = null
}) {
  try {
    const resolvedActor = getActor(req, actor);
    await AuditLog.create({
      id: nextPrefixedId('al'),
      actor_id: resolvedActor.id,
      actor_name: resolvedActor.name,
      actor_email: resolvedActor.email,
      actor_role: resolvedActor.role,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      ip: getRequestIp(req),
      user_agent: req.headers['user-agent'] || null,
      created_at: new Date()
    });
  } catch (_error) {
    // Never block main feature flow if audit write fails.
  }
}

module.exports = {
  logAudit
};
