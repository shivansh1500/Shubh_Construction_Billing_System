import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText, User, Package, Calculator, Palette,
  ChevronRight, Save, FileCheck, AlertCircle, RefreshCw,
} from 'lucide-react';
import BillItemsTable from '../components/bill/BillItemsTable';
import BillTotals from '../components/bill/BillTotals';
import TemplateSelector from '../components/bill/TemplateSelector';
import LoadingSpinner from '../components/LoadingSpinner';
import { billsAPI, settingsAPI } from '../services/api';
import { useToast } from '../components/Toast';
import { formatCurrency } from '../utils';

const INITIAL_ITEMS = [{ description: '', quantity: '', unit: 'Bag', rate: '', amount: 0 }];

function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="card overflow-hidden" style={{ borderColor: 'rgba(117, 107, 97, 0.28)' }}>
      <div
        className="flex items-center gap-3 px-6 py-4"
        style={{ borderBottom: '1px solid rgba(117, 107, 97, 0.2)', background: 'rgba(184,117,79,0.05)' }}
      >
        <div
          className="w-8 h-8 rounded-[8px] flex items-center justify-center"
          style={{ background: 'rgba(184,117,79,0.14)', border: '1px solid rgba(184,117,79,0.3)' }}
        >
          <Icon size={15} style={{ color: '#B8754F' }} />
        </div>
        <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="form-group">
      <label className="label">{label}</label>
      {children}
      {error && <p className="form-error flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
    </div>
  );
}

export default function CreateBill({ editMode = false }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(editMode);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [errors, setErrors] = useState({});
  const [settings, setSettings] = useState({});

  // Bill fields
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGST, setCustomerGST] = useState('');
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [discount, setDiscount] = useState('');
  const [taxRate, setTaxRate] = useState('18');
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [templateId, setTemplateId] = useState(null);
  const [existingBillId, setExistingBillId] = useState(null);

  useEffect(() => {
    initPage();
  }, []);

  async function initPage() {
    try {
      const [settingsRes, nextNumRes] = await Promise.all([
        settingsAPI.get(),
        editMode ? Promise.resolve(null) : billsAPI.getNextNumber(),
      ]);
      const s = settingsRes.data;
      setSettings(s);
      if (s.default_tax_rate) setTaxRate(String(s.default_tax_rate));

      if (!editMode && nextNumRes) {
        setBillNumber(nextNumRes.data.next_number);
      }

      if (editMode && id) {
        const billRes = await billsAPI.getById(id);
        const bill = billRes.data;
        setExistingBillId(bill.id);
        setBillNumber(bill.bill_number);
        setBillDate(bill.bill_date || '');
        setDueDate(bill.due_date || '');
        setCustomerName(bill.customer_name || '');
        setCustomerMobile(bill.customer_mobile || '');
        setCustomerAddress(bill.customer_address || '');
        setCustomerGST(bill.customer_gst || '');
        setDiscount(String(bill.discount || ''));
        setTaxRate(String(bill.tax_rate || s.default_tax_rate || 18));
        setTaxEnabled(bill.tax > 0);
        setTemplateId(bill.template_id);
        if (bill.items?.length) {
          setItems(bill.items.map(i => ({
            description: i.description,
            quantity: String(i.quantity),
            unit: i.unit,
            rate: String(i.rate),
            amount: i.amount,
          })));
        }
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load page data', 'error');
    } finally {
      setLoading(false);
    }
  }

  function calcTotals() {
    const subtotal = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    const discountAmt = parseFloat(discount) || 0;
    const afterDiscount = subtotal - discountAmt;
    const taxAmt = taxEnabled ? (afterDiscount * (parseFloat(taxRate) || 0)) / 100 : 0;
    return { subtotal, discount: discountAmt, tax: taxAmt, taxRate: parseFloat(taxRate) || 0, grandTotal: afterDiscount + taxAmt };
  }

  function validate() {
    const errs = {};
    if (!billNumber.trim()) errs.billNumber = 'Bill number is required.';
    if (!billDate) errs.billDate = 'Bill date is required.';
    if (!customerName.trim()) errs.customerName = 'Customer name is required.';
    if (items.length === 0) errs.items = 'Please add at least one item.';
    if (items.some(i => !i.description.trim())) errs.items = 'All items must have a description.';
    if (items.some(i => parseFloat(i.quantity) <= 0 || !i.quantity)) errs.items = 'Quantity must be greater than 0.';
    if (items.some(i => parseFloat(i.rate) < 0)) errs.items = 'Rate cannot be negative.';
    if (!templateId) errs.template = 'Please select a template.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function buildPayload() {
    const totals = calcTotals();
    return {
      bill_number: billNumber.trim(),
      bill_date: billDate,
      due_date: dueDate || null,
      customer_name: customerName.trim(),
      customer_mobile: customerMobile.trim(),
      customer_address: customerAddress.trim(),
      customer_gst: customerGST.trim(),
      template_id: templateId,
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax,
      tax_rate: totals.taxRate,
      grand_total: totals.grandTotal,
      items: items.map(i => ({
        description: i.description.trim(),
        quantity: parseFloat(i.quantity) || 0,
        unit: i.unit,
        rate: parseFloat(i.rate) || 0,
        amount: parseFloat(i.amount) || 0,
      })),
    };
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editMode && existingBillId) {
        await billsAPI.update(existingBillId, payload);
        addToast('Bill updated successfully', 'success');
      } else {
        const res = await billsAPI.create(payload);
        addToast('Bill saved successfully', 'success');
        setExistingBillId(res.data.id);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to save bill.';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate() {
    if (!validate()) return;
    setGenerating(true);
    try {
      const payload = buildPayload();
      let billId = existingBillId;

      // Save first if not saved
      if (!billId) {
        const res = await billsAPI.create(payload);
        billId = res.data.id;
        setExistingBillId(billId);
      } else {
        await billsAPI.update(billId, payload);
      }

      // Generate PDF
      const pdfRes = await billsAPI.generatePDF(billId);
      addToast('Bill generated successfully!', 'success');
      navigate(`/bill-preview/${billId}`, { state: { pdfPath: pdfRes.data.pdf_path } });
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to generate bill. Please try again.';
      addToast(msg, 'error');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  const totals = calcTotals();

  return (
    <div className="page-content animate-[fadeIn_0.4s_ease] max-w-5xl mx-auto">
      {/* Page heading */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge badge-copper">SPATIAL INVOICE</span>
          <span className="text-xs text-[#756B61] font-mono">•</span>
          <span className="text-xs text-[#A1A1AA] font-mono uppercase">Tax Compliant</span>
        </div>
        <h2 className="display-title text-white">
          {editMode ? 'Edit Spatial Invoice' : 'Craft New Invoice'}
        </h2>
        <p className="text-[#A1A1AA] text-sm mt-1">
          Specify items, units, and rates below, then click <strong className="text-white font-medium">Generate Bill</strong> to publish to Cloudinary and export the PDF.
        </p>
      </div>

      <div className="space-y-6">
        {/* ── BILL INFORMATION ── */}
        <SectionCard icon={FileText} title="Bill Information">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Bill Number *" error={errors.billNumber}>
              <input
                className="input"
                value={billNumber}
                onChange={e => setBillNumber(e.target.value)}
                placeholder="SC-0001"
              />
            </Field>
            <Field label="Bill Date *" error={errors.billDate}>
              <input
                className="input"
                type="date"
                value={billDate}
                onChange={e => setBillDate(e.target.value)}
              />
            </Field>
            <Field label="Due Date (Optional)">
              <input
                className="input"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </Field>
          </div>
        </SectionCard>

        {/* ── CUSTOMER INFORMATION ── */}
        <SectionCard icon={User} title="Customer Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Customer Name *" error={errors.customerName}>
              <input
                className="input"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
              />
            </Field>
            <Field label="Mobile Number">
              <input
                className="input"
                type="tel"
                value={customerMobile}
                onChange={e => setCustomerMobile(e.target.value)}
                placeholder="e.g. 9876543210"
              />
            </Field>
            <Field label="Customer Address">
              <textarea
                className="input"
                rows={2}
                value={customerAddress}
                onChange={e => setCustomerAddress(e.target.value)}
                placeholder="Full address..."
              />
            </Field>
            <Field label="GST Number (Optional)">
              <input
                className="input"
                value={customerGST}
                onChange={e => setCustomerGST(e.target.value)}
                placeholder="e.g. 27AAAAA0000A1Z5"
              />
            </Field>
          </div>
        </SectionCard>

        {/* ── BILL ITEMS ── */}
        <SectionCard icon={Package} title="Bill Items">
          {errors.items && (
            <div className="mb-4 flex items-center gap-2 text-red-400 text-sm p-3 rounded-[8px] bg-red-500/10 border border-red-500/20">
              <AlertCircle size={14} />
              {errors.items}
            </div>
          )}
          <BillItemsTable items={items} onChange={setItems} />
        </SectionCard>

        {/* ── CALCULATIONS ── */}
        <SectionCard icon={Calculator} title="Bill Calculations">
          <div className="max-w-md ml-auto">
            <BillTotals
              items={items}
              discount={discount}
              setDiscount={setDiscount}
              taxRate={taxRate}
              setTaxRate={setTaxRate}
              taxEnabled={taxEnabled}
              setTaxEnabled={setTaxEnabled}
              currency={settings.currency || '₹'}
            />
          </div>
        </SectionCard>

        {/* ── TEMPLATE ── */}
        <SectionCard icon={Palette} title="Select Template">
          {errors.template && (
            <div className="mb-4 flex items-center gap-2 text-red-400 text-sm p-3 rounded-[8px] bg-red-500/10 border border-red-500/20">
              <AlertCircle size={14} />
              {errors.template}
            </div>
          )}
          <TemplateSelector selectedId={templateId} onChange={setTemplateId} />
        </SectionCard>

        {/* ── ACTION BUTTONS ── */}
        <div
          className="rounded-[12px] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border"
          style={{ background: '#191C21', borderColor: 'rgba(117, 107, 97, 0.3)' }}
        >
          {/* Grand total preview */}
          <div>
            <p className="text-xs text-[#A1A1AA] font-mono tracking-widest uppercase">GRAND TOTAL</p>
            <p className="font-display text-3xl text-white mt-0.5">{formatCurrency(totals.grandTotal, settings.currency || '₹')}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn btn-secondary btn-pill"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <><div className="spinner" style={{ width: 15, height: 15 }} />Saving Draft...</>
              ) : (
                <><Save size={15} />Save Draft</>
              )}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-pill btn-lg shadow-copper"
              onClick={handleGenerate}
              disabled={generating || saving}
            >
              {generating ? (
                <><div className="spinner" style={{ width: 16, height: 16 }} />Generating & Uploading...</>
              ) : (
                <><FileCheck size={17} />Publish & Generate</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
