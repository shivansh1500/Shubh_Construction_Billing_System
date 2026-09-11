'use strict';

const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const unzipper = require('unzipper');
const fsExtra = require('fs-extra');
const Settings = require('../models/Settings');
const Template = require('../models/Template');
const Bill = require('../models/Bill');
const { DATA_DIR } = require('../database/db');

/**
 * On-demand local backup endpoint:
 * Dumps MongoDB collections (settings, templates, bills) to JSON
 * and downloads Cloudinary PDFs to the specified target directory.
 * POST /api/backup/local
 */
async function createLocalBackup(req, res) {
  try {
    const { targetPath } = req.body;
    if (!targetPath || !String(targetPath).trim()) {
      return res.status(400).json({ error: 'Target path is required for local backup.' });
    }

    const resolvedTarget = path.resolve(String(targetPath).trim());

    // Ensure target folder exists and is writable
    try {
      fs.mkdirSync(resolvedTarget, { recursive: true });
      fs.accessSync(resolvedTarget, fs.constants.W_OK);
    } catch (err) {
      return res.status(400).json({ error: `Cannot write to target directory: ${err.message}` });
    }

    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const backupDir = path.join(resolvedTarget, `backup-${stamp}`);
    const dataDir = path.join(backupDir, 'data');
    const billsDir = path.join(backupDir, 'bills');

    fs.mkdirSync(dataDir, { recursive: true });
    fs.mkdirSync(billsDir, { recursive: true });

    // 1. Fetch data from MongoDB
    const [settingsList, templatesList, billsList] = await Promise.all([
      Settings.find().lean(),
      Template.find().lean(),
      Bill.find().lean(),
    ]);

    // 2. Write JSON dumps
    fs.writeFileSync(path.join(dataDir, 'settings.json'), JSON.stringify(settingsList, null, 2), 'utf8');
    fs.writeFileSync(path.join(dataDir, 'templates.json'), JSON.stringify(templatesList, null, 2), 'utf8');
    fs.writeFileSync(path.join(dataDir, 'bills.json'), JSON.stringify(billsList, null, 2), 'utf8');

    // 3. Download PDFs from Cloudinary (or copy local if available)
    let downloadedCount = 0;
    let failedCount = 0;
    const failedFiles = [];

    for (const bill of billsList) {
      const billNumber = bill.bill_number ? bill.bill_number.replace(/[^a-zA-Z0-9-_]/g, '_') : `bill_${bill._id}`;
      const destPdfPath = path.join(billsDir, `${billNumber}.pdf`);

      if (bill.pdf_url && bill.pdf_url.startsWith('http')) {
        try {
          const response = await fetch(bill.pdf_url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          fs.writeFileSync(destPdfPath, Buffer.from(arrayBuffer));
          downloadedCount++;
        } catch (err) {
          console.error(`[Backup] Failed to download PDF for ${bill.bill_number}:`, err.message);
          failedCount++;
          failedFiles.push({ bill_number: bill.bill_number, error: err.message });
        }
      } else if (bill.pdf_path && fs.existsSync(bill.pdf_path)) {
        try {
          fs.copyFileSync(bill.pdf_path, destPdfPath);
          downloadedCount++;
        } catch (err) {
          failedCount++;
          failedFiles.push({ bill_number: bill.bill_number, error: err.message });
        }
      }
    }

    res.json({
      success: true,
      backupFolder: backupDir,
      timestamp: now.toISOString(),
      summary: {
        settingsCount: settingsList.length,
        templatesCount: templatesList.length,
        billsCount: billsList.length,
        pdfsDownloaded: downloadedCount,
        pdfsFailed: failedCount,
        failedFiles,
      },
    });
  } catch (err) {
    console.error('createLocalBackup error:', err);
    res.status(500).json({ error: 'Local backup failed: ' + err.message });
  }
}

// Legacy ZIP backup
function createBackup(req, res) {
  try {
    const { path: destPath } = req.body;
    if (!destPath) return res.status(400).json({ error: 'Backup destination path is required.' });

    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }

    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    const backupFile = path.join(destPath, `shubh-billing-backup-${stamp}.zip`);

    const output = fs.createWriteStream(backupFile);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      res.json({ success: true, backup_file: backupFile, size_bytes: archive.pointer() });
    });

    archive.on('error', (err) => {
      console.error('Backup archive error:', err);
      res.status(500).json({ error: 'Backup failed: ' + err.message });
    });

    archive.pipe(output);

    if (fs.existsSync(DATA_DIR)) {
      archive.directory(DATA_DIR, 'data');
    }

    archive.finalize();
  } catch (err) {
    console.error('createBackup error:', err);
    res.status(500).json({ error: 'Backup failed: ' + err.message });
  }
}

// Legacy ZIP restore
async function restoreBackup(req, res) {
  try {
    const { path: zipPath } = req.body;
    if (!zipPath) return res.status(400).json({ error: 'Backup file path is required.' });

    if (!fs.existsSync(zipPath)) {
      return res.status(400).json({ error: 'Backup file not found at the specified path.' });
    }

    const tempDir = path.join(DATA_DIR, '..', '_restore_temp');
    await fsExtra.remove(tempDir);
    await fsExtra.ensureDir(tempDir);

    await new Promise((resolve, reject) => {
      fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: tempDir }))
        .on('close', resolve)
        .on('error', reject);
    });

    const restoredData = path.join(tempDir, 'data');
    if (fs.existsSync(restoredData)) {
      await fsExtra.remove(DATA_DIR);
      await fsExtra.move(restoredData, DATA_DIR);
    }

    await fsExtra.remove(tempDir);

    res.json({ success: true, message: 'Data restored successfully. Please restart the application.' });
  } catch (err) {
    console.error('restoreBackup error:', err);
    res.status(500).json({ error: 'Restore failed: ' + err.message });
  }
}

module.exports = {
  createLocalBackup,
  createBackup,
  restoreBackup,
};
