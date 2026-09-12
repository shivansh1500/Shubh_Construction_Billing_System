'use strict';

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const Bill = require('../models/Bill');
const Template = require('../models/Template');
const Settings = require('../models/Settings');
const cloudinaryService = require('../services/cloudinaryService');
const pdfService = require('../services/pdfService');
const { BILLS_DIR } = require('../database/db');

function getBaseUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host') || 'localhost:3001';
  return `${protocol}://${host}`;
}

async function getNextBillNumber() {
  const settings = await Settings.findOne();
  const prefix = settings?.bill_prefix || 'SC';
  const startNum = settings?.starting_number || 1;

  // Find all bills with this prefix
  const prefixRegex = new RegExp(`^${prefix}-(\\d+)`, 'i');
  const bills = await Bill.find({ bill_number: { $regex: prefixRegex } }, { bill_number: 1 });

  if (!bills || bills.length === 0) {
    return `${prefix}-${String(startNum).padStart(4, '0')}`;
  }

  let maxNum = startNum - 1;
  for (const b of bills) {
    const match = b.bill_number.match(prefixRegex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  return `${prefix}-${String(maxNum + 1).padStart(4, '0')}`;
}

// GET /api/bills/next-number
async function getNextNumber(req, res) {
  try {
    const next = await getNextBillNumber();
    res.json({ next_number: next });
  } catch (err) {
    console.error('getNextNumber error:', err);
    res.status(500).json({ error: 'Failed to generate bill number' });
  }
}

// GET /api/bills
async function getAllBills(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      date_from,
      date_to,
      sort = 'created_at',
      order = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (search && search.trim()) {
      const s = search.trim();
      const regex = new RegExp(s, 'i');
      query.$or = [
        { bill_number: regex },
        { customer_name: regex },
        { customer_mobile: regex },
      ];
    }

    if (date_from || date_to) {
      query.bill_date = {};
      if (date_from) query.bill_date.$gte = date_from;
      if (date_to) query.bill_date.$lte = date_to;
    }

    // Map sort fields to schema fields
    const sortFieldMap = {
      created_at: 'createdAt',
      createdAt: 'createdAt',
      bill_date: 'bill_date',
      grand_total: 'grand_total',
      customer_name: 'customer_name',
      bill_number: 'bill_number',
    };

    const sortField = sortFieldMap[sort] || 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;

    const [bills, total, revAgg] = await Promise.all([
      Bill.find(query)
        .populate('template')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean({ virtuals: true }),
      Bill.countDocuments(query),
      Bill.aggregate([
        { $group: { _id: null, totalRevenue: { $sum: '$grand_total' } } },
      ]),
    ]);

    const totalRevenue = revAgg.length > 0 ? revAgg[0].totalRevenue : 0;
    const baseUrl = getBaseUrl(req);

    const enrichedBills = bills.map((b) => {
      b.id = String(b._id);
      b._id = String(b._id);
      if (b.pdf_public_id || b.pdf_url) {
        b.pdf_path = `${baseUrl}/api/bills/${b._id}/pdf`;
        b.pdf_url = `${baseUrl}/api/bills/${b._id}/pdf`;
      }
      return b;
    });

    res.json({
      bills: enrichedBills,
      total,
      totalRevenue,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error('getAllBills error:', err);
    res.status(500).json({ error: 'Failed to load bills' });
  }
}

// GET /api/bills/:id
async function getBillById(req, res) {
  try {
    let bill = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      bill = await Bill.findById(req.params.id).populate('template').lean({ virtuals: true });
    }
    if (!bill) {
      bill = await Bill.findOne({ bill_number: req.params.id }).populate('template').lean({ virtuals: true });
    }

    if (!bill) return res.status(404).json({ error: 'Bill not found' });

    bill.id = String(bill._id);
    bill._id = String(bill._id);

    if (bill.pdf_public_id || bill.pdf_url) {
      const baseUrl = getBaseUrl(req);
      bill.pdf_path = `${baseUrl}/api/bills/${bill._id}/pdf`;
      bill.pdf_url = `${baseUrl}/api/bills/${bill._id}/pdf`;
    }

    res.json(bill);
  } catch (err) {
    console.error('getBillById error:', err);
    res.status(500).json({ error: 'Failed to load bill' });
  }
}

// POST /api/bills
async function createBill(req, res) {
  try {
    const {
      bill_date, due_date, customer_name, customer_mobile,
      customer_address, customer_gst, template_id, template, subtotal, discount,
      tax, tax_rate, grand_total, items = [],
    } = req.body;

    // Validation — bill_number is server-generated, not accepted from client
    if (!bill_date) return res.status(400).json({ error: 'Bill date is required.' });
    if (!customer_name?.trim()) return res.status(400).json({ error: 'Customer name is required.' });
    if (!items.length) return res.status(400).json({ error: 'Please add at least one item.' });

    let templateRef = template || template_id || null;
    if (templateRef && !mongoose.Types.ObjectId.isValid(templateRef)) {
      // If an integer or string template ID was passed from old SQLite
      const foundTemplate = await Template.findOne();
      templateRef = foundTemplate ? foundTemplate._id : null;
    }

    const billData = {
      bill_date,
      due_date: due_date || null,
      customer_name: customer_name.trim(),
      customer_mobile: customer_mobile || '',
      customer_address: customer_address || '',
      customer_gst: customer_gst || '',
      template: templateRef,
      subtotal: parseFloat(subtotal) || 0,
      discount: parseFloat(discount) || 0,
      tax: parseFloat(tax) || 0,
      tax_rate: parseFloat(tax_rate) || 0,
      grand_total: parseFloat(grand_total) || 0,
      items: items.map(item => ({
        description: item.description || '',
        quantity: parseFloat(item.quantity) || 0,
        unit: item.unit || 'Nos',
        rate: parseFloat(item.rate) || 0,
        amount: parseFloat(item.amount) || 0,
      })),
    };

    // Server-generated bill number with retry loop for race-condition safety.
    // MongoDB's unique index on bill_number (E11000) is the final guard; we
    // retry up to 5 times so two simultaneous requests never get the same number.
    const MAX_RETRIES = 5;
    let bill;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const generatedNumber = await getNextBillNumber();
      try {
        bill = await Bill.create({ ...billData, bill_number: generatedNumber });
        break; // success — exit retry loop
      } catch (dupErr) {
        // E11000 = MongoDB duplicate key error
        if (dupErr.code === 11000 && attempt < MAX_RETRIES) {
          console.warn(`createBill: duplicate bill_number "${generatedNumber}", retrying (attempt ${attempt})...`);
          continue;
        }
        throw dupErr; // re-throw if not a dup error or we've exhausted retries
      }
    }

    const result = await Bill.findById(bill._id).populate('template').lean({ virtuals: true });
    // Always include both _id and id as strings so the frontend can reliably use either
    result._id = result._id.toString();
    result.id = result._id;
    res.status(201).json(result);
  } catch (err) {
    console.error('createBill error:', err);
    res.status(500).json({ error: 'Failed to create bill: ' + err.message });
  }
}

// PUT /api/bills/:id
async function updateBill(req, res) {
  try {
    let bill = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      bill = await Bill.findById(req.params.id);
    }
    if (!bill) {
      bill = await Bill.findOne({ bill_number: req.params.id });
    }
    if (!bill) return res.status(404).json({ error: 'Bill not found' });

    const {
      bill_number, bill_date, due_date, customer_name, customer_mobile,
      customer_address, customer_gst, template_id, template, subtotal, discount,
      tax, tax_rate, grand_total, items = [],
    } = req.body;

    // Check duplicate bill number if changed
    if (bill_number && bill_number.trim() !== bill.bill_number) {
      const dup = await Bill.findOne({
        bill_number: bill_number.trim(),
        _id: { $ne: bill._id },
      });
      if (dup) return res.status(409).json({ error: `Bill number "${bill_number}" already exists.` });
      bill.bill_number = bill_number.trim();
    }

    if (bill_date !== undefined) bill.bill_date = bill_date;
    if (due_date !== undefined) bill.due_date = due_date || null;
    if (customer_name !== undefined) bill.customer_name = customer_name.trim();
    if (customer_mobile !== undefined) bill.customer_mobile = customer_mobile;
    if (customer_address !== undefined) bill.customer_address = customer_address;
    if (customer_gst !== undefined) bill.customer_gst = customer_gst;

    const templateRef = template !== undefined ? template : template_id;
    if (templateRef !== undefined) {
      if (templateRef && mongoose.Types.ObjectId.isValid(templateRef)) {
        bill.template = templateRef;
      } else if (!templateRef) {
        bill.template = null;
      }
    }

    if (subtotal !== undefined) bill.subtotal = parseFloat(subtotal) || 0;
    if (discount !== undefined) bill.discount = parseFloat(discount) || 0;
    if (tax !== undefined) bill.tax = parseFloat(tax) || 0;
    if (tax_rate !== undefined) bill.tax_rate = parseFloat(tax_rate) || 0;
    if (grand_total !== undefined) bill.grand_total = parseFloat(grand_total) || 0;

    if (Array.isArray(items)) {
      bill.items = items.map(item => ({
        description: item.description || '',
        quantity: parseFloat(item.quantity) || 0,
        unit: item.unit || 'Nos',
        rate: parseFloat(item.rate) || 0,
        amount: parseFloat(item.amount) || 0,
      }));
    }

    await bill.save();
    const updated = await Bill.findById(bill._id).populate('template').lean({ virtuals: true });
    updated._id = updated._id.toString();
    updated.id = updated._id;
    res.json(updated);
  } catch (err) {
    console.error('updateBill error:', err);
    res.status(500).json({ error: 'Failed to update bill: ' + err.message });
  }
}

// DELETE /api/bills/:id
async function deleteBill(req, res) {
  try {
    let bill = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      bill = await Bill.findById(req.params.id);
    }
    if (!bill) {
      bill = await Bill.findOne({ bill_number: req.params.id });
    }
    if (!bill) return res.status(404).json({ error: 'Bill not found' });

    // Delete PDF from Cloudinary if it exists
    if (bill.pdf_public_id) {
      await cloudinaryService.deleteAsset(bill.pdf_public_id, 'raw');
    }

    await Bill.findByIdAndDelete(bill._id);
    res.json({ success: true, message: 'Bill deleted successfully' });
  } catch (err) {
    console.error('deleteBill error:', err);
    res.status(500).json({ error: 'Failed to delete bill: ' + err.message });
  }
}

// POST /api/bills/:id/pdf
async function generateBillPdf(req, res) {
  try {
    let bill = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      bill = await Bill.findById(req.params.id).populate('template');
    }
    if (!bill) {
      bill = await Bill.findOne({ bill_number: req.params.id }).populate('template');
    }
    if (!bill) return res.status(404).json({ error: 'Bill not found' });

    let template = bill.template;
    if (!template) {
      template = await Template.findOne({ is_default: 1 });
    }
    if (!template) {
      template = await Template.findOne();
    }
    if (!template) {
      return res.status(400).json({ error: 'No template found. Please create a template first.' });
    }

    // Delete old Cloudinary asset if regenerating
    if (bill.pdf_public_id) {
      await cloudinaryService.deleteAsset(bill.pdf_public_id, 'raw');
    }

    const uploadResult = await pdfService.generatePDF({
      bill,
      items: bill.items || [],
      template,
    });

    bill.pdf_url = uploadResult.url;
    bill.pdf_public_id = uploadResult.public_id;
    await bill.save();

    const baseUrl = getBaseUrl(req);
    const streamUrl = `${baseUrl}/api/bills/${bill._id}/pdf`;

    res.json({
      success: true,
      pdf_path: streamUrl,
      pdf_url: streamUrl,
      cloudinary_url: uploadResult.url,
      pdf_public_id: uploadResult.public_id,
      bill_number: bill.bill_number,
    });
  } catch (err) {
    console.error('generateBillPdf error:', err);
    res.status(500).json({ error: 'Failed to generate PDF: ' + err.message });
  }
}

// GET /api/bills/:id/pdf
async function getBillPdf(req, res) {
  try {
    let bill = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      bill = await Bill.findById(req.params.id);
    }
    if (!bill) {
      bill = await Bill.findOne({ bill_number: req.params.id });
    }
    if (!bill) return res.status(404).json({ error: 'Bill not found' });

    const isDownload = req.query.download === 'true' || req.query.download === '1';
    const disposition = isDownload ? 'attachment' : 'inline';
    const filename = `Invoice-${bill.bill_number || bill._id}.pdf`;

    // 1. Try streaming from Cloudinary using authenticated signed URL
    if (bill.pdf_public_id && cloudinaryService.isConfigured()) {
      const downloadUrl = cloudinaryService.getDownloadUrl(bill.pdf_public_id);
      if (downloadUrl) {
        return new Promise((resolve) => {
          const client = downloadUrl.startsWith('https') ? https : http;
          const request = client.get(downloadUrl, (stream) => {
            if (stream.statusCode === 200) {
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
              if (stream.headers['content-length']) {
                res.setHeader('Content-Length', stream.headers['content-length']);
              }
              stream.pipe(res);
              stream.on('end', resolve);
              return;
            }

            // If Cloudinary didn't return 200, try local file fallback
            checkLocalFallback();
            resolve();
          });

          request.on('error', (err) => {
            console.error('[getBillPdf] Cloudinary stream error:', err.message);
            checkLocalFallback();
            resolve();
          });
        });
      }
    }

    // 2. Fallback: check local file or direct URL
    function checkLocalFallback() {
      if (bill.bill_number) {
        const localFilename = `${bill.bill_number.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;
        const localPath = path.join(BILLS_DIR, localFilename);
        if (fs.existsSync(localPath)) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
          return res.sendFile(localPath);
        }
      }
      if (bill.pdf_url && bill.pdf_url.startsWith('http')) {
        return res.redirect(bill.pdf_url);
      }
      if (!res.headersSent) {
        res.status(404).json({ error: 'PDF file not available for this bill' });
      }
    }

    checkLocalFallback();
  } catch (err) {
    console.error('getBillPdf error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to retrieve PDF: ' + err.message });
    }
  }
}

module.exports = {
  getNextNumber,
  getAllBills,
  getBillById,
  createBill,
  updateBill,
  deleteBill,
  generateBillPdf,
  getBillPdf,
};
