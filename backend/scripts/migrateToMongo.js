'use strict';

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Database = require('better-sqlite3');
const mongoose = require('mongoose');

const Settings = require('../models/Settings');
const Template = require('../models/Template');
const Bill = require('../models/Bill');
const cloudinaryService = require('../services/cloudinaryService');

const SQLITE_PATH = path.join(__dirname, '..', 'data', 'database', 'billing.db');

async function migrate() {
  console.log('==============================================');
  console.log(' Starting Migration: SQLite -> MongoDB');
  console.log('==============================================');

  if (!fs.existsSync(SQLITE_PATH)) {
    console.error(`[Error] SQLite database not found at ${SQLITE_PATH}`);
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shubh_billing';
  console.log(`Connecting to MongoDB at ${mongoUri}...`);
  await mongoose.connect(mongoUri);
  console.log('MongoDB connected successfully.\n');

  const db = new Database(SQLITE_PATH, { readonly: true });
  const hasCloudinary = cloudinaryService.isConfigured();

  if (!hasCloudinary) {
    console.warn('⚠️  [Warning] Cloudinary credentials not detected in .env.');
    console.warn('   Local file paths will be retained. Once credentials are set in .env,');
    console.warn('   re-running this script will upload pending files to Cloudinary.\n');
  }

  const stats = {
    settings: 0,
    templates: 0,
    bills: 0,
    billItems: 0,
    uploadedPdfs: 0,
    uploadedImages: 0,
    failedFiles: [],
  };

  const templateIdMap = new Map(); // old integer ID -> new Mongo ObjectId

  // ─── 1. Migrate Settings ────────────────────────────────────
  console.log('--- Migrating Settings ---');
  try {
    const sqliteSettings = db.prepare('SELECT * FROM settings').all();
    for (const s of sqliteSettings) {
      let logoUrl = s.logo_path || '';
      let logoPublicId = '';
      let sigUrl = s.signature_path || '';
      let sigPublicId = '';

      if (hasCloudinary && logoUrl && fs.existsSync(logoUrl)) {
        try {
          const buffer = fs.readFileSync(logoUrl);
          const uploaded = await cloudinaryService.uploadImage(buffer, 'logos');
          logoUrl = uploaded.url;
          logoPublicId = uploaded.public_id;
          stats.uploadedImages++;
          console.log(`  Uploaded settings logo to Cloudinary: ${logoUrl}`);
        } catch (err) {
          stats.failedFiles.push({ file: logoUrl, error: err.message });
          console.error(`  Failed to upload settings logo: ${err.message}`);
        }
      }

      if (hasCloudinary && sigUrl && fs.existsSync(sigUrl)) {
        try {
          const buffer = fs.readFileSync(sigUrl);
          const uploaded = await cloudinaryService.uploadImage(buffer, 'signatures');
          sigUrl = uploaded.url;
          sigPublicId = uploaded.public_id;
          stats.uploadedImages++;
          console.log(`  Uploaded settings signature to Cloudinary: ${sigUrl}`);
        } catch (err) {
          stats.failedFiles.push({ file: sigUrl, error: err.message });
          console.error(`  Failed to upload settings signature: ${err.message}`);
        }
      }

      await Settings.findOneAndUpdate(
        {},
        {
          $set: {
            company_name: s.company_name || '',
            company_address: s.company_address || '',
            company_phone: s.company_phone || '',
            company_email: s.company_email || '',
            gst_number: s.gst_number || '',
            logo_url: logoUrl,
            logo_public_id: logoPublicId,
            signature_url: sigUrl,
            signature_public_id: sigPublicId,
            default_tax_rate: s.default_tax_rate || 18,
            currency: s.currency || '₹',
            bill_prefix: s.bill_prefix || 'SC',
            starting_number: s.starting_number || 1,
          },
        },
        { upsert: true, returnDocument: 'after' }
      );
      stats.settings++;
    }
    console.log(` Migrated ${stats.settings} settings record(s).\n`);
  } catch (err) {
    console.error('Error migrating settings:', err.message);
  }

  // ─── 2. Migrate Templates ───────────────────────────────────
  console.log('--- Migrating Templates ---');
  try {
    const sqliteTemplates = db.prepare('SELECT * FROM templates').all();
    for (const t of sqliteTemplates) {
      let logoUrl = t.logo_path || '';
      let logoPublicId = '';
      let sigUrl = t.signature_path || '';
      let sigPublicId = '';

      if (hasCloudinary && logoUrl && fs.existsSync(logoUrl)) {
        try {
          const buffer = fs.readFileSync(logoUrl);
          const uploaded = await cloudinaryService.uploadImage(buffer, 'logos');
          logoUrl = uploaded.url;
          logoPublicId = uploaded.public_id;
          stats.uploadedImages++;
          console.log(`  Uploaded template logo to Cloudinary: ${logoUrl}`);
        } catch (err) {
          stats.failedFiles.push({ file: logoUrl, error: err.message });
          console.error(`  Failed to upload template logo: ${err.message}`);
        }
      }

      if (hasCloudinary && sigUrl && fs.existsSync(sigUrl)) {
        try {
          const buffer = fs.readFileSync(sigUrl);
          const uploaded = await cloudinaryService.uploadImage(buffer, 'signatures');
          sigUrl = uploaded.url;
          sigPublicId = uploaded.public_id;
          stats.uploadedImages++;
          console.log(`  Uploaded template signature to Cloudinary: ${sigUrl}`);
        } catch (err) {
          stats.failedFiles.push({ file: sigUrl, error: err.message });
          console.error(`  Failed to upload template signature: ${err.message}`);
        }
      }

      let mongoTemplate = await Template.findOne({ name: t.name });
      if (!mongoTemplate) {
        mongoTemplate = await Template.create({
          name: t.name,
          is_default: t.is_default || 0,
          company_name: t.company_name || '',
          company_address: t.company_address || '',
          company_phone: t.company_phone || '',
          company_email: t.company_email || '',
          gst_number: t.gst_number || '',
          logo_url: logoUrl,
          logo_public_id: logoPublicId,
          signature_url: sigUrl,
          signature_public_id: sigPublicId,
          footer_text: t.footer_text || '',
          template_html: t.template_html || '',
          template_css: t.template_css || '',
        });
      } else {
        mongoTemplate.company_name = t.company_name || mongoTemplate.company_name;
        mongoTemplate.company_address = t.company_address || mongoTemplate.company_address;
        mongoTemplate.company_phone = t.company_phone || mongoTemplate.company_phone;
        mongoTemplate.company_email = t.company_email || mongoTemplate.company_email;
        mongoTemplate.gst_number = t.gst_number || mongoTemplate.gst_number;
        if (logoUrl) {
          mongoTemplate.logo_url = logoUrl;
          mongoTemplate.logo_public_id = logoPublicId;
        }
        if (sigUrl) {
          mongoTemplate.signature_url = sigUrl;
          mongoTemplate.signature_public_id = sigPublicId;
        }
        await mongoTemplate.save();
      }

      templateIdMap.set(t.id, mongoTemplate._id);
      stats.templates++;
      console.log(`  Template "${t.name}" -> ${mongoTemplate._id}`);
    }
    console.log(` Migrated ${stats.templates} template(s).\n`);
  } catch (err) {
    console.error('Error migrating templates:', err.message);
  }

  // ─── 3. Migrate Bills & Items ───────────────────────────────
  console.log('--- Migrating Bills & Items ---');
  try {
    const sqliteBills = db.prepare('SELECT * FROM bills').all();
    for (const b of sqliteBills) {
      const items = db.prepare('SELECT * FROM bill_items WHERE bill_id = ? ORDER BY id').all(b.id);
      stats.billItems += items.length;

      let pdfUrl = b.pdf_path || '';
      let pdfPublicId = '';

      // Check if local PDF exists and should be uploaded to Cloudinary
      if (hasCloudinary && pdfUrl && fs.existsSync(pdfUrl)) {
        try {
          console.log(`  Uploading PDF for bill ${b.bill_number}...`);
          const uploaded = await cloudinaryService.uploadPDF(pdfUrl, b.bill_number);
          pdfUrl = uploaded.url;
          pdfPublicId = uploaded.public_id;
          stats.uploadedPdfs++;
          console.log(`  ✓ Cloudinary PDF: ${pdfUrl}`);
        } catch (err) {
          stats.failedFiles.push({ file: pdfUrl, error: err.message });
          console.error(`  Failed to upload bill PDF: ${err.message}`);
        }
      }

      const templateRef = templateIdMap.get(b.template_id) || null;

      const billData = {
        bill_number: b.bill_number,
        bill_date: b.bill_date,
        due_date: b.due_date || null,
        customer_name: b.customer_name,
        customer_mobile: b.customer_mobile || '',
        customer_address: b.customer_address || '',
        customer_gst: b.customer_gst || '',
        template: templateRef,
        subtotal: b.subtotal || 0,
        discount: b.discount || 0,
        tax: b.tax || 0,
        tax_rate: b.tax_rate || 0,
        grand_total: b.grand_total || 0,
        pdf_url: pdfUrl,
        pdf_public_id: pdfPublicId,
        items: items.map(it => ({
          description: it.description,
          quantity: it.quantity || 0,
          unit: it.unit || 'Nos',
          rate: it.rate || 0,
          amount: it.amount || 0,
        })),
      };

      await Bill.findOneAndUpdate(
        { bill_number: b.bill_number },
        { $set: billData },
        { upsert: true, returnDocument: 'after' }
      );
      stats.bills++;
      console.log(`  Migrated Bill "${b.bill_number}" (${items.length} items)`);
    }
    console.log(` Migrated ${stats.bills} bill(s) with ${stats.billItems} items.\n`);
  } catch (err) {
    console.error('Error migrating bills:', err.message);
  }

  // ─── Summary ───────────────────────────────────────────────
  console.log('==============================================');
  console.log(' Migration Summary');
  console.log('==============================================');
  console.log(` Settings:        ${stats.settings}`);
  console.log(` Templates:       ${stats.templates}`);
  console.log(` Bills:           ${stats.bills}`);
  console.log(` Embedded Items:  ${stats.billItems}`);
  console.log(` Uploaded PDFs:   ${stats.uploadedPdfs}`);
  console.log(` Uploaded Images: ${stats.uploadedImages}`);

  if (stats.failedFiles.length > 0) {
    console.log(`\n⚠️  Failed Files (${stats.failedFiles.length}):`);
    stats.failedFiles.forEach(f => console.log(`  - ${f.file}: ${f.error}`));
  } else {
    console.log('\n All records migrated successfully with 0 file failures.');
  }
  console.log('==============================================\n');

  db.close();
  await mongoose.disconnect();
}

migrate()
  .then(() => {
    console.log('Migration script finished.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
