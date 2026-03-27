const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const authRoutes = require('./routes/auth');
const filesRoutes = require('./routes/files');
const importExportRoutes = require('./routes/importExport');
const contactRoutes = require('./routes/contact');
const { ensureAdminSeed } = require('./utils/seed');

const app = express();
const PORT = process.env.PORT || 5000;
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

async function connectWithRetry() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is missing. Add it to your .env file.');
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });
    // eslint-disable-next-line no-console
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('MongoDB connection failed, retrying in 5s...', error.message);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return connectWithRetry();
  }
}

async function startServer() {
  try {
    await connectWithRetry();
    await ensureAdminSeed();

    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`TMMS backend listening on port ${PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
