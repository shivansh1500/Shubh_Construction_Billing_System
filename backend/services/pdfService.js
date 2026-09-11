'use strict';

const path = require('path');
const fs = require('fs');
const cloudinaryService = require('./cloudinaryService');
const Settings = require('../models/Settings');

let puppeteerBrowser = null;

async function getBrowser() {
  if (!puppeteerBrowser) {
    const puppeteer = require('puppeteer');

    // Try to find a usable Chrome executable
    const chromePaths = {
      darwin: [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
      ],
      linux: [
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
      ],
      win32: [],
    };

    const platformPaths = chromePaths[process.platform] || [];
    let executablePath = undefined;

    for (const p of platformPaths) {
      if (fs.existsSync(p)) {
        executablePath = p;
        console.log('[PDF] Using system Chrome:', p);
        break;
      }
    }

    const launchArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--disable-extensions',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-translate',
      '--metrics-recording-only',
      '--no-default-browser-check',
      '--password-store=basic',
      '--safebrowsing-disable-auto-update',
    ];

    puppeteerBrowser = await puppeteer.launch({
      headless: process.platform === 'darwin' ? true : 'new',
      executablePath,
      args: launchArgs,
    });
  }
  return puppeteerBrowser;
}

function formatCurrency(amount, currency = '₹') {
  if (!amount || isNaN(amount)) return `${currency}0.00`;
  return `${currency}${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function buildItemsHtml(items = [], currency = '₹') {
  return items
    .map((item, idx) => `
      <tr>
        <td class="center">${idx + 1}</td>
        <td>${escapeHtml(item.description || '')}</td>
        <td class="center">${item.quantity || 0}</td>
        <td class="center">${escapeHtml(item.unit || 'Nos')}</td>
        <td class="right">${formatCurrency(item.rate, currency)}</td>
        <td class="right">${formatCurrency(item.amount, currency)}</td>
      </tr>
    `)
    .join('');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function injectData(templateHtml, templateCss, { bill, items, template, currency }) {
  const has = (v) => v && String(v).trim() !== '';

  const itemsHtml = buildItemsHtml(items, currency);

  const rawLogo = template.logo_url || template.logo_path || '';
  const rawSignature = template.signature_url || template.signature_path || '';

  const logoSrc = rawLogo.startsWith('http')
    ? rawLogo
    : (rawLogo ? `file://${rawLogo.replace(/\\/g, '/')}` : '');

  const signatureSrc = rawSignature.startsWith('http')
    ? rawSignature
    : (rawSignature ? `file://${rawSignature.replace(/\\/g, '/')}` : '');

  const logoTag = has(logoSrc)
    ? `<img src="${logoSrc}" alt="Logo" class="logo" />`
    : '';
  const signatureTag = has(signatureSrc)
    ? `<img src="${signatureSrc}" alt="Signature" class="signature-img" />`
    : '';

  // Handle conditional blocks {{#if field}}...{{/if}}
  let html = templateHtml;
  html = html.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, content) => {
    const value = getFieldValue(key, { bill, template, currency, logoSrc, signatureSrc });
    return has(value) ? content : '';
  });

  // Insert CSS
  html = html.replace(/\{\{css\}\}/g, templateCss || '');

  // Replace placeholders
  const replacements = {
    companyName: template.company_name || '',
    companyAddress: template.company_address || '',
    companyPhone: template.company_phone || '',
    companyEmail: template.company_email || '',
    gstNumber: template.gst_number || '',
    logoPath: logoSrc,
    logoUrl: logoSrc,
    signaturePath: signatureSrc,
    signatureUrl: signatureSrc,
    footerText: template.footer_text || '',
    billNumber: bill.bill_number || '',
    billDate: formatDate(bill.bill_date),
    dueDate: formatDate(bill.due_date),
    customerName: bill.customer_name || '',
    customerAddress: bill.customer_address || '',
    customerMobile: bill.customer_mobile || '',
    customerGST: bill.customer_gst || '',
    subtotal: formatCurrency(bill.subtotal, currency),
    discount: formatCurrency(bill.discount, currency),
    tax: formatCurrency(bill.tax, currency),
    taxRate: bill.tax_rate || 0,
    grandTotal: formatCurrency(bill.grand_total, currency),
    items: itemsHtml,
    logoTag,
    signatureTag,
  };

  for (const [key, value] of Object.entries(replacements)) {
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }

  return html;
}

function getFieldValue(key, { bill, template, currency, logoSrc, signatureSrc }) {
  const map = {
    logoPath: logoSrc,
    logoUrl: logoSrc,
    signaturePath: signatureSrc,
    signatureUrl: signatureSrc,
    gstNumber: template.gst_number,
    companyAddress: template.company_address,
    companyPhone: template.company_phone,
    companyEmail: template.company_email,
    customerAddress: bill.customer_address,
    customerMobile: bill.customer_mobile,
    customerGST: bill.customer_gst,
    dueDate: bill.due_date,
    discount: bill.discount,
    tax: bill.tax,
  };
  return map[key] || '';
}

/**
 * Generates PDF from template and bill data, uploads buffer to Cloudinary
 * @param {object} param0
 * @returns {Promise<{ url: string, public_id: string, pdf_path: string }>}
 */
async function generatePDF({ bill, items, template }) {
  const settings = await Settings.findOne();
  const currency = settings?.currency || '₹';

  const finalHtml = injectData(
    template.template_html || '',
    template.template_css || '',
    { bill, items, template, currency }
  );

  const browser = await getBrowser();
  const page = await browser.newPage();

  let pdfBuffer;
  try {
    await page.setContent(finalHtml, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 30000,
    });

    pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    });
  } finally {
    await page.close();
  }

  // Upload buffer to Cloudinary
  const uploadResult = await cloudinaryService.uploadPDF(pdfBuffer, bill.bill_number);

  return {
    url: uploadResult.url,
    public_id: uploadResult.public_id,
    pdf_path: uploadResult.url,
  };
}

module.exports = { generatePDF };
