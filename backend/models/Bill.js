'use strict';

const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 0 },
    unit: { type: String, default: 'Nos' },
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
  },
  { _id: true }
);

const billSchema = new mongoose.Schema(
  {
    bill_number: { type: String, required: true, unique: true, index: true, trim: true },
    bill_date: { type: String, required: true, index: true },
    due_date: { type: String, default: null },
    customer_name: { type: String, required: true, index: true, trim: true },
    customer_mobile: { type: String, default: '', index: true, trim: true },
    customer_address: { type: String, default: '', trim: true },
    customer_gst: { type: String, default: '', trim: true },
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', default: null },
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    tax_rate: { type: Number, default: 0 },
    grand_total: { type: Number, default: 0 },
    pdf_url: { type: String, default: '' },
    pdf_public_id: { type: String, default: '' },
    items: [billItemSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Backward-compatibility aliases for frontend
billSchema.virtual('id').get(function () {
  return this._id ? this._id.toHexString() : undefined;
});

billSchema.virtual('pdf_path').get(function () {
  return this.pdf_url;
}).set(function (val) {
  this.pdf_url = val;
});

billSchema.virtual('template_id').get(function () {
  return this.template?._id || this.template;
}).set(function (val) {
  this.template = val;
});

module.exports = mongoose.model('Bill', billSchema);
