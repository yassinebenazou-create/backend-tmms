const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const auditRoutes = require('./routes/audit');
const filesRoutes = require('./routes/files');
const importExportRoutes = require('./routes/importExport');
const contactRoutes = require('./routes/contact');

const app = express();
const VERSION = '1.0.0';

app.use(cors({ origin: '*', credentials: false }));
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: mongoose.connection.readyState === 1 ? 'ok' : 'degraded',
    version: VERSION,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'TMMS backend is running.',
    docs: 'Auth: /api/auth | Files: /api/access | Excel Analyzer: /api/import/upload'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/access', filesRoutes);
app.use('/api/import', importExportRoutes);
app.use('/api/contact', contactRoutes);

app.use((error, _req, res, _next) => {
  if (error instanceof Error && error.message.includes('File too large')) {
    return res.status(413).json({ success: false, message: 'File too large.' });
  }

  // eslint-disable-next-line no-console
  console.error('Unhandled error:', error);
  const message = error?.message || 'Internal server error';
  return res.status(500).json({ success: false, message });
});

module.exports = app;
