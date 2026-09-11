'use strict';

const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    company_name: { type: String, default: '' },
    company_address: { type: String, default: '' },
    company_phone: { type: String, default: '' },
    company_email: { type: String, default: '' },
    gst_number: { type: String, default: '' },
    logo_url: { type: String, default: '' },
    logo_public_id: { type: String, default: '' },
    signature_url: { type: String, default: '' },
    signature_public_id: { type: String, default: '' },
    default_tax_rate: { type: Number, default: 18 },
    currency: { type: String, default: '₹' },
    bill_prefix: { type: String, default: 'SC' },
    starting_number: { type: Number, default: 1 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Backward-compatibility aliases for frontend
settingsSchema.virtual('logo_path').get(function () {
  return this.logo_url;
}).set(function (val) {
  this.logo_url = val;
});

settingsSchema.virtual('signature_path').get(function () {
  return this.signature_url;
}).set(function (val) {
  this.signature_url = val;
});

module.exports = mongoose.model('Settings', settingsSchema);
