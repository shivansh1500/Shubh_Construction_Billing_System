'use strict';

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_DIR = path.join(DATA_DIR, 'database');
const BILLS_DIR = path.join(DATA_DIR, 'bills');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const TEMPLATES_DIR = path.join(DATA_DIR, 'templates');
const DB_PATH = path.join(DB_DIR, 'billing.db');

// Ensure directories exist
[DB_DIR, BILLS_DIR, BACKUPS_DIR, UPLOADS_DIR, TEMPLATES_DIR].forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

let isConnected = false;

async function connectDB() {
  if (isConnected) return mongoose.connection;

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shubh_billing';
  try {
    const conn = await mongoose.connect(uri);
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to ${conn.connection.name}`);

    await seedInitialData();
    return conn;
  } catch (err) {
    console.error('[MongoDB] Connection error:', err.message);
    throw err;
  }
}

async function seedInitialData() {
  const Template = require('../models/Template');
  const Settings = require('../models/Settings');

  // Seed default settings if none exist
  const settingsCount = await Settings.countDocuments();
  if (settingsCount === 0) {
    await Settings.create({
      company_name: 'Shubh Construction',
      company_address: '123, MG Road, Pune, Maharashtra 411001',
      company_phone: '+91 98765 43210',
      company_email: 'info@shubhconstruction.com',
      gst_number: '27AAAAA0000A1Z5',
      default_tax_rate: 18,
      currency: '₹',
      bill_prefix: 'SC',
      starting_number: 1,
    });
    console.log('[Seed] Default settings created.');
  }

  // Seed default template if none exists
  const templateCount = await Template.countDocuments();
  if (templateCount === 0) {
    const html = getDefaultTemplateHtml();
    const css = getDefaultTemplateCss();
    await Template.create({
      name: 'Modern Construction Bill',
      is_default: 1,
      company_name: 'Shubh Construction',
      company_address: '123, MG Road, Pune, Maharashtra 411001',
      company_phone: '+91 98765 43210',
      company_email: 'info@shubhconstruction.com',
      gst_number: '27AAAAA0000A1Z5',
      footer_text: 'Thank you for your business! Payment due within 7 days.',
      template_html: html,
      template_css: css,
    });
    console.log('[Seed] Default template created.');
  }
}

function getDefaultTemplateHtml() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>{{css}}</style>
</head>
<body>
<div class="invoice">
  <div class="header">
    <div class="company-info">
      {{#if logoPath}}<img src="{{logoPath}}" alt="Logo" class="logo" />{{/if}}
      <h1 class="company-name">{{companyName}}</h1>
      <p>{{companyAddress}}</p>
      <p>{{companyPhone}} | {{companyEmail}}</p>
      {{#if gstNumber}}<p><strong>GSTIN:</strong> {{gstNumber}}</p>{{/if}}
    </div>
    <div class="invoice-meta">
      <h2>TAX INVOICE</h2>
      <table class="meta-table">
        <tr><td>Invoice No.</td><td><strong>{{billNumber}}</strong></td></tr>
        <tr><td>Date</td><td>{{billDate}}</td></tr>
        {{#if dueDate}}<tr><td>Due Date</td><td>{{dueDate}}</td></tr>{{/if}}
      </table>
    </div>
  </div>

  <div class="bill-to">
    <div class="bill-to-header">Bill To</div>
    <p class="customer-name">{{customerName}}</p>
    {{#if customerAddress}}<p>{{customerAddress}}</p>{{/if}}
    {{#if customerMobile}}<p>Mob: {{customerMobile}}</p>{{/if}}
    {{#if customerGST}}<p>GSTIN: {{customerGST}}</p>{{/if}}
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th class="center">#</th>
        <th>Description</th>
        <th class="center">Qty</th>
        <th class="center">Unit</th>
        <th class="right">Rate</th>
        <th class="right">Amount</th>
      </tr>
    </thead>
    <tbody>
      {{items}}
    </tbody>
  </table>

  <div class="totals-section">
    <div class="totals-box">
      <div class="total-row"><span>Subtotal</span><span>{{subtotal}}</span></div>
      {{#if discount}}<div class="total-row discount"><span>Discount</span><span>- {{discount}}</span></div>{{/if}}
      {{#if tax}}<div class="total-row"><span>GST ({{taxRate}}%)</span><span>{{tax}}</span></div>{{/if}}
      <div class="total-row grand"><span>Grand Total</span><span>{{grandTotal}}</span></div>
    </div>
  </div>

  {{#if signaturePath}}
  <div class="signature-section">
    <div class="signature-block">
      <img src="{{signaturePath}}" alt="Signature" class="signature-img" />
      <p class="signature-label">Authorized Signatory</p>
      <p class="signature-company">{{companyName}}</p>
    </div>
  </div>
  {{/if}}

  <div class="footer">
    <p>{{footerText}}</p>
    <p class="footer-note">This is a computer generated invoice.</p>
  </div>
</div>
</body>
</html>`;
}

function getDefaultTemplateCss() {
  return `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #2d2d2d; background: #fff; }
.invoice { max-width: 800px; margin: 0 auto; padding: 40px 48px; }
.logo { max-height: 60px; max-width: 180px; object-fit: contain; margin-bottom: 12px; display: block; }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 3px solid #B8754F; gap: 24px; }
.company-info { flex: 1; }
.company-name { font-size: 22px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px; letter-spacing: -0.3px; }
.company-info p { font-size: 12px; color: #555; line-height: 1.7; }
.invoice-meta { text-align: right; flex-shrink: 0; }
.invoice-meta h2 { font-size: 22px; font-weight: 800; color: #B8754F; letter-spacing: 0.05em; margin-bottom: 12px; }
.meta-table td { font-size: 12px; padding: 3px 0 3px 16px; color: #555; }
.meta-table td:first-child { color: #999; padding-left: 0; }
.bill-to { background: linear-gradient(135deg, #fdf9f6 0%, #f9f3ee 100%); border-left: 4px solid #B8754F; padding: 16px 20px; margin-bottom: 28px; border-radius: 0 6px 6px 0; }
.bill-to-header { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #B8754F; margin-bottom: 10px; }
.customer-name { font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 5px; }
.bill-to p { font-size: 12px; color: #555; line-height: 1.7; }
.items-table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
.items-table thead tr { background: linear-gradient(135deg, #B8754F 0%, #9B5F3F 100%); }
.items-table th { color: white; padding: 11px 14px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
.items-table th.center { text-align: center; }
.items-table th.right { text-align: right; }
.items-table td { padding: 11px 14px; border-bottom: 1px solid #f0e8e0; font-size: 13px; vertical-align: middle; }
.items-table td.center { text-align: center; }
.items-table td.right { text-align: right; font-weight: 500; }
.items-table tbody tr:nth-child(even) { background: #fdf9f7; }
.items-table tbody tr:hover { background: #fdf1e8; }
.totals-section { display: flex; justify-content: flex-end; margin-bottom: 36px; }
.totals-box { min-width: 280px; border: 1px solid #e8d5c4; border-radius: 8px; overflow: hidden; }
.total-row { display: flex; justify-content: space-between; padding: 9px 16px; border-bottom: 1px solid #f0e8e0; font-size: 13px; }
.total-row:last-child { border-bottom: none; }
.total-row.discount span:last-child { color: #16a34a; }
.total-row.grand { background: linear-gradient(135deg, #B8754F, #9B5F3F); color: white; font-size: 15px; font-weight: 700; padding: 13px 16px; }
.signature-section { display: flex; justify-content: flex-end; margin-bottom: 32px; }
.signature-block { text-align: center; }
.signature-img { max-height: 60px; max-width: 160px; object-fit: contain; display: block; margin: 0 auto 6px; }
.signature-label { font-size: 11px; color: #555; border-top: 1px solid #ccc; padding-top: 6px; margin-top: 4px; }
.signature-company { font-size: 11px; font-weight: 600; color: #1a1a1a; }
.footer { text-align: center; border-top: 1px solid #f0e8e0; padding-top: 20px; }
.footer p { font-size: 12px; color: #888; line-height: 1.7; }
.footer-note { font-size: 10px; color: #bbb; margin-top: 6px; }
`;
}

module.exports = {
  connectDB,
  DATA_DIR,
  BILLS_DIR,
  BACKUPS_DIR,
  UPLOADS_DIR,
  TEMPLATES_DIR,
  DB_PATH,
};
