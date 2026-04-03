const express = require('express');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const authMiddleware = require('../utils/authMiddleware');
const requireRole = require('../utils/roleMiddleware');
const AuditLog = require('../models/AuditLog');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

function buildAuditQuery(queryInput = {}) {
  const {
    action = '',
    actorId = '',
    search = '',
    dateFrom = '',
    dateTo = ''
  } = queryInput;

  const query = {};

  if (action) query.action = String(action).trim();
  if (actorId) query.actor_id = String(actorId).trim();

  const createdAt = {};
  if (dateFrom) createdAt.$gte = new Date(dateFrom);
  if (dateTo) createdAt.$lte = new Date(`${dateTo}T23:59:59.999Z`);
  if (Object.keys(createdAt).length) query.created_at = createdAt;

  if (search) {
    const pattern = new RegExp(String(search).trim(), 'i');
    query.$or = [
      { actor_name: pattern },
      { actor_email: pattern },
      { action: pattern },
      { entity_type: pattern },
      { entity_id: pattern }
    ];
  }

  return query;
}

function toRows(logs = []) {
  return logs.map((log) => ({
    Date: log.created_at ? new Date(log.created_at).toISOString() : '',
    ActorName: log.actor_name || '',
    ActorEmail: log.actor_email || '',
    ActorRole: log.actor_role || '',
    Action: log.action || '',
    EntityType: log.entity_type || '',
    EntityId: log.entity_id || '',
    Details: JSON.stringify(log.details || {}),
    IP: log.ip || '',
    UserAgent: log.user_agent || ''
  }));
}

router.get('/logs', authMiddleware, requireRole('admin'), async (req, res) => {
  const { limit = '100' } = req.query || {};
  const query = buildAuditQuery(req.query || {});

  const safeLimit = Math.max(1, Math.min(500, Number(limit) || 100));
  const logs = await AuditLog.find(query).sort({ created_at: -1 }).limit(safeLimit).lean();
  return res.status(200).json({ success: true, logs });
});

router.get('/logs/export/excel', authMiddleware, requireRole('admin'), async (req, res) => {
  const query = buildAuditQuery(req.query || {});
  const logs = await AuditLog.find(query).sort({ created_at: -1 }).limit(5000).lean();

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(toRows(logs));
  XLSX.utils.book_append_sheet(workbook, sheet, 'Audit Logs');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.xlsx"`);
  return res.status(200).send(buffer);
});

router.get('/logs/export/pdf', authMiddleware, requireRole('admin'), async (req, res) => {
  const query = buildAuditQuery(req.query || {});
  const logs = await AuditLog.find(query).sort({ created_at: -1 }).limit(1000).lean();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.pdf"`);

  const doc = new PDFDocument({ margin: 36, size: 'A4' });
  doc.pipe(res);
  doc.fontSize(16).text('TMMS Audit Logs', { align: 'left' });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`);
  doc.moveDown();

  logs.forEach((log, index) => {
    if (doc.y > 740) doc.addPage();

    doc
      .fontSize(10)
      .text(`${index + 1}. ${log.action || '-'} | ${log.entity_type || '-'} (${log.entity_id || '-'})`, {
        continued: false
      });
    doc.fontSize(9).text(`Date: ${log.created_at ? new Date(log.created_at).toISOString() : '-'}`);
    doc.fontSize(9).text(`Actor: ${log.actor_name || '-'} | ${log.actor_email || '-'} | ${log.actor_role || '-'}`);
    doc.fontSize(9).text(`Details: ${JSON.stringify(log.details || {})}`);
    doc.moveDown(0.6);
  });

  doc.end();
});

router.delete('/logs', authMiddleware, requireRole('admin'), async (req, res) => {
  const result = await AuditLog.deleteMany({});

  await logAudit({
    req,
    action: 'audit.logs.clear_all',
    entityType: 'audit_log',
    entityId: null,
    details: { deletedCount: result.deletedCount || 0 }
  });

  return res.status(200).json({
    success: true,
    message: 'All audit logs deleted.',
    deletedCount: result.deletedCount || 0
  });
});

module.exports = router;
