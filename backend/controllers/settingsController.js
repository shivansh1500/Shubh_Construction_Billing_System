'use strict';

const Settings = require('../models/Settings');

async function getSettings(req, res) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (err) {
    console.error('getSettings error:', err);
    res.status(500).json({ error: 'Failed to load settings' });
  }
}

async function updateSettings(req, res) {
  try {
    const {
      company_name, company_address, company_phone, company_email, gst_number,
      logo_path, logo_url, signature_path, signature_url,
      default_tax_rate, currency, bill_prefix, starting_number,
    } = req.body;

    const updateData = {
      company_name: company_name || '',
      company_address: company_address || '',
      company_phone: company_phone || '',
      company_email: company_email || '',
      gst_number: gst_number || '',
      default_tax_rate: parseFloat(default_tax_rate) || 18,
      currency: currency || '₹',
      bill_prefix: bill_prefix || 'SC',
      starting_number: parseInt(starting_number, 10) || 1,
    };

    if (logo_url !== undefined) updateData.logo_url = logo_url;
    else if (logo_path !== undefined) updateData.logo_url = logo_path;

    if (signature_url !== undefined) updateData.signature_url = signature_url;
    else if (signature_path !== undefined) updateData.signature_url = signature_path;

    let settings = await Settings.findOneAndUpdate(
      {},
      { $set: updateData },
      { returnDocument: 'after', upsert: true }
    );

    res.json(settings);
  } catch (err) {
    console.error('updateSettings error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
}

module.exports = { getSettings, updateSettings };
