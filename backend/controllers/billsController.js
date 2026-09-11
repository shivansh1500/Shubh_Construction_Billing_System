'use strict';

const mongoose = require('mongoose');
const Bill = require('../models/Bill');
const Template = require('../models/Template');
const Settings = require('../models/Settings');
const cloudinaryService = require('../services/cloudinaryService');
const pdfService = require('../services/pdfService');

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

    res.json({
      bills,
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
      bill_number, bill_date, due_date, customer_name, customer_mobile,
      customer_address, customer_gst, template_id, template, subtotal, discount,
      tax, tax_rate, grand_total, items = [],
    } = req.body;

    // Validation
    if (!bill_number?.trim()) return res.status(400).json({ error: 'Bill number is required.' });
    if (!bill_date) return res.status(400).json({ error: 'Bill date is required.' });
    if (!customer_name?.trim()) return res.status(400).json({ error: 'Customer name is required.' });
    if (!items.length) return res.status(400).json({ error: 'Please add at least one item.' });

    // Check duplicate
    const exists = await Bill.findOne({ bill_number: bill_number.trim() });
    if (exists) {
      return res.status(409).json({ error: `Bill number "${bill_number}" already exists.` });
    }

    let templateRef = template || template_id || null;
    if (templateRef && !mongoose.Types.ObjectId.isValid(templateRef)) {
      // If an integer or string template ID was passed from old SQLite
      const foundTemplate = await Template.findOne();
      templateRef = foundTemplate ? foundTemplate._id : null;
    }

    const bill = await Bill.create({
      bill_number: bill_number.trim(),
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
    });

    const result = await Bill.findById(bill._id).populate('template').lean({ virtuals: true });
    res.status(201).json(result);
  } catch (err) {
    console.error('createBill error:', err);
    res.status(500).json({ error: 'Failed to create bill: ' + err.message });
  }
}

// PUT /api/bills/:id
async function updateBill(req, res) {
  try {
    const bill = await Bill.findById(req.params.id);
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
    res.json(updated);
  } catch (err) {
    console.error('updateBill error:', err);
    res.status(500).json({ error: 'Failed to update bill: ' + err.message });
  }
}

// DELETE /api/bills/:id
async function deleteBill(req, res) {
  try {
    const bill = await Bill.findById(req.params.id);
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
    const bill = await Bill.findById(req.params.id).populate('template');
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

    res.json({
      success: true,
      pdf_path: uploadResult.url,
      pdf_url: uploadResult.url,
      pdf_public_id: uploadResult.public_id,
      bill_number: bill.bill_number,
    });
  } catch (err) {
    console.error('generateBillPdf error:', err);
    res.status(500).json({ error: 'Failed to generate PDF: ' + err.message });
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
};
