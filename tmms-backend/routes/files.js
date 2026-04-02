const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const multer = require('multer');
const authMiddleware = require('../utils/authMiddleware');
const requireRole = require('../utils/roleMiddleware');
const ManagedFile = require('../models/ManagedFile');
const User = require('../models/User');
const UserFile = require('../models/UserFile');
const AccessRequest = require('../models/AccessRequest');
const { nextPrefixedId } = require('../utils/id');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

function resolveUploadDir() {
  const candidates = [
    path.join('/tmp', 'tmms-uploads'),
    path.join(os.tmpdir(), 'tmms-uploads'),
    path.join(__dirname, '..', 'uploads')
  ];

  for (const candidate of candidates) {
    try {
      fs.mkdirSync(candidate, { recursive: true });
      return candidate;
    } catch (_error) {
      // Try next candidate.
    }
  }

  throw new Error('Unable to initialize upload directory.');
}

const uploadDir = resolveUploadDir();

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/webp'
]);
const allowedExtensions = new Set(['.pdf', '.docx', '.xlsx', '.png', '.jpg', '.jpeg', '.webp']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const base = path.basename(file.originalname || 'file', ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const mimeAllowed = allowedMimeTypes.has(file.mimetype);
    const extensionAllowed = allowedExtensions.has(extension);

    if (!mimeAllowed && !extensionAllowed) {
      return cb(new Error('Unsupported file type. Allowed: PDF, DOCX, XLSX, PNG, JPG, WEBP'));
    }
    return cb(null, true);
  }
});

router.get('/files', authMiddleware, async (req, res) => {
  const files = await ManagedFile.find().sort({ created_at: -1 }).lean();

  let accessSet = new Set();
  if (req.user.role !== 'admin') {
    const links = await UserFile.find({ user_id: req.user.id }).lean();
    accessSet = new Set(links.map((l) => l.file_id));
  }

  const statuses = await AccessRequest.find({ user_id: req.user.id }).sort({ created_at: -1 }).lean();
  const statusMap = new Map();
  statuses.forEach((s) => {
    if (!statusMap.has(s.file_id)) statusMap.set(s.file_id, s.status);
  });

  const result = files.map((file) => ({
    ...file,
    hasAccess: req.user.role === 'admin' ? true : accessSet.has(file.id),
    requestStatus: statusMap.get(file.id) || null
  }));

  return res.status(200).json({ success: true, files: result });
});

router.post('/files/upload', authMiddleware, requireRole('admin'), (req, res) => {
  upload.single('file')(req, res, async (error) => {
    if (error) {
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ success: false, message: 'File too large. Max 15MB.' });
      }
      return res.status(400).json({ success: false, message: error.message || 'Upload failed.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File is required.' });
    }

    const fileRecord = new ManagedFile({
      id: nextPrefixedId('f'),
      name: req.body.name || req.file.originalname,
      original_name: req.file.originalname,
      path: req.file.filename,
      mime_type: req.file.mimetype,
      type: 'file',
      powerbi_url: null,
      created_at: new Date(),
      created_by: req.user.id
    });

    await fileRecord.save();
    await logAudit({
      req,
      action: 'file.upload',
      entityType: 'file',
      entityId: fileRecord.id,
      details: {
        name: fileRecord.name,
        originalName: fileRecord.original_name
      }
    });

    const rawAssign = req.body.assignTo;
    const assignTo = Array.isArray(rawAssign) ? rawAssign : rawAssign ? [rawAssign] : [];

    if (assignTo.length) {
      await Promise.all(
        assignTo.map(async (userId) => {
          const exists = await UserFile.findOne({ user_id: userId, file_id: fileRecord.id }).lean();
          if (!exists) {
            await UserFile.create({
              id: nextPrefixedId('uf'),
              user_id: userId,
              file_id: fileRecord.id,
              created_at: new Date()
            });
          }
        })
      );
    }

    return res.status(201).json({ success: true, file: fileRecord });
  });
});

router.post('/files/powerbi', authMiddleware, requireRole('admin'), async (req, res) => {
  const { name, powerBiUrl, assignTo = [] } = req.body || {};

  if (!name || !powerBiUrl) {
    return res.status(400).json({ success: false, message: 'Name and powerBiUrl are required.' });
  }

  const fileRecord = await ManagedFile.create({
    id: nextPrefixedId('f'),
    name,
    original_name: name,
    path: null,
    mime_type: null,
    type: 'powerbi',
    powerbi_url: powerBiUrl,
    created_at: new Date(),
    created_by: req.user.id
  });
  await logAudit({
    req,
    action: 'powerbi.create',
    entityType: 'file',
    entityId: fileRecord.id,
    details: { name, powerBiUrl }
  });

  const users = Array.isArray(assignTo) ? assignTo : [assignTo];
  await Promise.all(
    users.filter(Boolean).map(async (userId) => {
      const exists = await UserFile.findOne({ user_id: userId, file_id: fileRecord.id }).lean();
      if (!exists) {
        await UserFile.create({
          id: nextPrefixedId('uf'),
          user_id: userId,
          file_id: fileRecord.id,
          created_at: new Date()
        });
      }
    })
  );

  await logAudit({
    req,
    action: 'file.assign',
    entityType: 'file',
    entityId: file.id,
    details: { userIds: users.filter(Boolean) }
  });

  return res.status(201).json({ success: true, file: fileRecord });
});

router.post('/files/:id/assign', authMiddleware, requireRole('admin'), async (req, res) => {
  const { userIds = [] } = req.body || {};
  const file = await ManagedFile.findOne({ id: req.params.id }).lean();

  if (!file) {
    return res.status(404).json({ success: false, message: 'File not found.' });
  }

  const users = Array.isArray(userIds) ? userIds : [userIds];
  await Promise.all(
    users.filter(Boolean).map(async (userId) => {
      const exists = await UserFile.findOne({ user_id: userId, file_id: file.id }).lean();
      if (!exists) {
        await UserFile.create({
          id: nextPrefixedId('uf'),
          user_id: userId,
          file_id: file.id,
          created_at: new Date()
        });
      }
    })
  );

  return res.status(200).json({ success: true, message: 'File assigned successfully.' });
});

router.patch('/files/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const { name, powerBiUrl } = req.body || {};
  const file = await ManagedFile.findOne({ id: req.params.id });

  if (!file) {
    return res.status(404).json({ success: false, message: 'File not found.' });
  }

  if (name) file.name = name;
  if (file.type === 'powerbi' && powerBiUrl) file.powerbi_url = powerBiUrl;

  await file.save();
  await logAudit({
    req,
    action: 'file.update',
    entityType: 'file',
    entityId: file.id,
    details: { name: file.name, powerBiUrl: file.powerbi_url || null }
  });
  return res.status(200).json({ success: true, file });
});

router.delete('/files/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const removed = await ManagedFile.findOneAndDelete({ id: req.params.id }).lean();

  if (!removed) {
    return res.status(404).json({ success: false, message: 'File not found.' });
  }

  await UserFile.deleteMany({ file_id: removed.id });
  await AccessRequest.deleteMany({ file_id: removed.id });

  if (removed.path) {
    const fullPath = path.join(uploadDir, removed.path);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }

  await logAudit({
    req,
    action: 'file.delete',
    entityType: 'file',
    entityId: removed.id,
    details: { name: removed.name, type: removed.type }
  });

  return res.status(200).json({ success: true, message: 'File deleted.' });
});

router.get('/files/:id/download', authMiddleware, async (req, res) => {
  const file = await ManagedFile.findOne({ id: req.params.id }).lean();

  if (!file) {
    return res.status(404).json({ success: false, message: 'File not found.' });
  }

  let canAccess = req.user.role === 'admin';
  if (!canAccess) {
    const link = await UserFile.findOne({ user_id: req.user.id, file_id: file.id }).lean();
    canAccess = Boolean(link);
  }

  if (!canAccess) {
    return res.status(403).json({ success: false, message: 'No access to this file.' });
  }

  if (file.type === 'powerbi') {
    return res.status(200).json({ success: true, powerBiUrl: file.powerbi_url, file });
  }

  const absolute = path.join(uploadDir, file.path || '');
  if (!fs.existsSync(absolute)) {
    return res.status(404).json({ success: false, message: 'Physical file not found.' });
  }

  return res.download(absolute, file.original_name || file.name);
});

router.post('/files/:id/request-access', authMiddleware, requireRole('user'), async (req, res) => {
  const file = await ManagedFile.findOne({ id: req.params.id }).lean();

  if (!file) {
    return res.status(404).json({ success: false, message: 'File not found.' });
  }

  const hasAccess = await UserFile.findOne({ user_id: req.user.id, file_id: file.id }).lean();
  if (hasAccess) {
    return res.status(400).json({ success: false, message: 'You already have access.' });
  }

  const openRequest = await AccessRequest.findOne({
    user_id: req.user.id,
    file_id: file.id,
    status: 'pending'
  }).lean();

  if (openRequest) {
    return res.status(409).json({ success: false, message: 'Access request already pending.' });
  }

  const request = await AccessRequest.create({
    id: nextPrefixedId('r'),
    user_id: req.user.id,
    file_id: file.id,
    status: 'pending',
    created_at: new Date(),
    updated_at: new Date()
  });

  await logAudit({
    req,
    action: 'access.request.create',
    entityType: 'access_request',
    entityId: request.id,
    details: { fileId: file.id }
  });

  return res.status(201).json({ success: true, request });
});

router.get('/requests', authMiddleware, async (req, res) => {
  const query = req.user.role === 'admin' ? {} : { user_id: req.user.id };

  const requests = await AccessRequest.find(query).sort({ created_at: -1 }).lean();
  const userIds = [...new Set(requests.map((r) => r.user_id))];
  const fileIds = [...new Set(requests.map((r) => r.file_id))];

  const users = await User.find({ id: { $in: userIds } }).lean();
  const files = await ManagedFile.find({ id: { $in: fileIds } }).lean();

  const userMap = new Map(users.map((u) => [u.id, u]));
  const fileMap = new Map(files.map((f) => [f.id, f]));

  const enriched = requests.map((request) => ({
    ...request,
    user: userMap.get(request.user_id) || null,
    file: fileMap.get(request.file_id) || null
  }));

  return res.status(200).json({ success: true, requests: enriched });
});

router.patch('/requests/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const { status } = req.body || {};
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
  }

  const request = await AccessRequest.findOne({ id: req.params.id });

  if (!request) {
    return res.status(404).json({ success: false, message: 'Request not found.' });
  }

  request.status = status;
  request.updated_at = new Date();
  await request.save();

  if (status === 'approved') {
    const exists = await UserFile.findOne({ user_id: request.user_id, file_id: request.file_id }).lean();
    if (!exists) {
      await UserFile.create({
        id: nextPrefixedId('uf'),
        user_id: request.user_id,
        file_id: request.file_id,
        created_at: new Date()
      });
    }
  }

  await logAudit({
    req,
    action: `access.request.${status}`,
    entityType: 'access_request',
    entityId: request.id,
    details: { userId: request.user_id, fileId: request.file_id }
  });

  return res.status(200).json({ success: true, request });
});

module.exports = router;

