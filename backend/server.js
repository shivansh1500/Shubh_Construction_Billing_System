'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const { connectDB, BILLS_DIR, UPLOADS_DIR } = require('./database/db');
const cloudinaryService = require('./services/cloudinaryService');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────────
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static file serving (for fallback) ────────────────────
app.use('/bills', express.static(BILLS_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

// Serve the compiled web frontend when it has been built
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

// ─── Memory Storage File Upload ───────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|svg|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
               allowed.test(file.mimetype.split('/')[1]);
    cb(ok ? null : new Error('Only image files are allowed'), ok);
  },
});

app.post('/upload/logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    if (!cloudinaryService.isConfigured()) {
      return res.status(500).json({
        error: 'Cloudinary credentials are not configured in .env. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      });
    }

    const result = await cloudinaryService.uploadImage(req.file.buffer, 'logos');
    res.json({
      path: result.url,
      url: result.url,
      public_id: result.public_id,
      filename: result.public_id,
    });
  } catch (err) {
    console.error('Logo upload error:', err);
    res.status(500).json({ error: 'Failed to upload logo: ' + err.message });
  }
});

app.post('/upload/signature', upload.single('signature'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    if (!cloudinaryService.isConfigured()) {
      return res.status(500).json({
        error: 'Cloudinary credentials are not configured in .env. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      });
    }

    const result = await cloudinaryService.uploadImage(req.file.buffer, 'signatures');
    res.json({
      path: result.url,
      url: result.url,
      public_id: result.public_id,
      filename: result.public_id,
    });
  } catch (err) {
    console.error('Signature upload error:', err);
    res.status(500).json({ error: 'Failed to upload signature: ' + err.message });
  }
});

// ─── API Routes ───────────────────────────────────────────
app.use('/api/bills', require('./routes/bills'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api', require('./routes/backup'));

// ─── Health check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    cloudinary: cloudinaryService.isConfigured() ? 'configured' : 'not_configured',
  });
});

// ─── Fallback for React SPA ───────────────────────────────
if (fs.existsSync(frontendDist)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ─── Error handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────
let server;

connectDB()
  .then(() => {
    server = app.listen(PORT, '127.0.0.1', () => {
      console.log(`[Shubh Billing Backend] Running on http://127.0.0.1:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Fatal: Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => { if (server) server.close(() => process.exit(0)); });
process.on('SIGINT', () => { if (server) server.close(() => process.exit(0)); });

module.exports = { app, server };
