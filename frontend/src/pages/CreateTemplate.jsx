import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Save, ArrowLeft, Building2, Phone, Mail, MapPin,
  Hash, Eye, Upload, AlertCircle, RefreshCw,
} from 'lucide-react';
import { templatesAPI, uploadAPI } from '../services/api';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

const SAMPLE_DATA = {
  companyName: 'Shubh Construction',
  companyAddress: '123, MG Road, Pune, Maharashtra 411001',
  companyPhone: '+91 98765 43210',
  companyEmail: 'info@shubhconstruction.com',
  gstNumber: '27AAAAA0000A1Z5',
  billNumber: 'SC-0001',
  billDate: '03 Sep 2026',
  dueDate: '10 Sep 2026',
  customerName: 'Rahul Sharma',
  customerAddress: '456, Shivaji Nagar, Pune 411005',
  customerMobile: '9876543210',
  customerGST: '',
  items: [
    { sno: 1, description: 'Cement (OPC 53 Grade)', quantity: 10, unit: 'Bag', rate: 400, amount: 4000 },
    { sno: 2, description: 'River Sand', quantity: 5, unit: 'Ton', rate: 1500, amount: 7500 },
    { sno: 3, description: 'Steel Rods (12mm)', quantity: 2, unit: 'Kg', rate: 75, amount: 150 },
  ],
  subtotal: 11650,
  discount: 650,
  tax: 1980,
  taxRate: 18,
  grandTotal: 12980,
  footerText: 'Thank you for your business. Payment due within 7 days.',
};

function injectSampleData(html, data) {
  if (!html) return '';
  let result = html;
  result = result.replace(/{{companyName}}/g, data.companyName || '');
  result = result.replace(/{{companyAddress}}/g, data.companyAddress || '');
  result = result.replace(/{{companyPhone}}/g, data.companyPhone || '');
  result = result.replace(/{{companyEmail}}/g, data.companyEmail || '');
  result = result.replace(/{{gstNumber}}/g, data.gstNumber || '');
  result = result.replace(/{{billNumber}}/g, data.billNumber || '');
  result = result.replace(/{{billDate}}/g, data.billDate || '');
  result = result.replace(/{{dueDate}}/g, data.dueDate || '');
  result = result.replace(/{{customerName}}/g, data.customerName || '');
  result = result.replace(/{{customerAddress}}/g, data.customerAddress || '');
  result = result.replace(/{{customerMobile}}/g, data.customerMobile || '');
  result = result.replace(/{{customerGST}}/g, data.customerGST || '');
  result = result.replace(/{{subtotal}}/g, `₹${Number(data.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
  result = result.replace(/{{discount}}/g, `₹${Number(data.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
  result = result.replace(/{{tax}}/g, `₹${Number(data.tax).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
  result = result.replace(/{{grandTotal}}/g, `₹${Number(data.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
  result = result.replace(/{{footerText}}/g, data.footerText || '');

  // Items table
  const itemsHtml = data.items.map(i =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${i.sno}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">${i.description}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${i.unit}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">₹${Number(i.rate).toLocaleString('en-IN')}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">₹${Number(i.amount).toLocaleString('en-IN')}</td>
    </tr>`
  ).join('');
  result = result.replace(/{{items}}/g, itemsHtml);

  return result;
}

function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid #2A2F38', background: 'rgba(184,117,79,0.04)' }}>
        <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: 'rgba(184,117,79,0.12)', border: '1px solid rgba(184,117,79,0.2)' }}>
          <Icon size={15} style={{ color: '#B8754F' }} />
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function CreateTemplate({ editMode = false }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(editMode);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [logoPath, setLogoPath] = useState('');
  const [signaturePath, setSignaturePath] = useState('');
  const [footerText, setFooterText] = useState('Thank you for your business!');
  const [templateHtml, setTemplateHtml] = useState(DEFAULT_TEMPLATE_HTML);
  const [templateCss, setTemplateCss] = useState(DEFAULT_TEMPLATE_CSS);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editMode && id) loadTemplate();
  }, []);

  async function loadTemplate() {
    try {
      const res = await templatesAPI.getById(id);
      const t = res.data;
      setName(t.name || '');
      setCompanyName(t.company_name || '');
      setCompanyAddress(t.company_address || '');
      setCompanyPhone(t.company_phone || '');
      setCompanyEmail(t.company_email || '');
      setGstNumber(t.gst_number || '');
      setLogoPath(t.logo_path || '');
      setSignaturePath(t.signature_path || '');
      setFooterText(t.footer_text || '');
      setTemplateHtml(t.template_html || DEFAULT_TEMPLATE_HTML);
      setTemplateCss(t.template_css || DEFAULT_TEMPLATE_CSS);
    } catch {
      addToast('Failed to load template', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const res = await uploadAPI.logo(fd);
      setLogoPath(res.data.path);
      addToast('Logo uploaded', 'success');
    } catch {
      addToast('Failed to upload logo', 'error');
    }
  }

  async function handleSignatureUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('signature', file);
      const res = await uploadAPI.signature(fd);
      setSignaturePath(res.data.path);
      addToast('Signature uploaded', 'success');
    } catch {
      addToast('Failed to upload signature', 'error');
    }
  }

  function validate() {
    const errs = {};
    if (!name.trim()) errs.name = 'Template name is required.';
    if (!companyName.trim()) errs.companyName = 'Company name is required.';
    if (!templateHtml.trim()) errs.html = 'Template HTML is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        company_name: companyName.trim(),
        company_address: companyAddress.trim(),
        company_phone: companyPhone.trim(),
        company_email: companyEmail.trim(),
        gst_number: gstNumber.trim(),
        logo_path: logoPath,
        signature_path: signaturePath,
        footer_text: footerText,
        template_html: templateHtml,
        template_css: templateCss,
      };
      if (editMode && id) {
        await templatesAPI.update(id, payload);
        addToast('Template updated successfully', 'success');
      } else {
        await templatesAPI.create(payload);
        addToast('Template created successfully', 'success');
      }
      navigate('/templates');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to save template', 'error');
    } finally {
      setSaving(false);
    }
  }

  const previewHtml = injectSampleData(
    templateHtml.replace(/{{css}}/g, templateCss),
    { ...SAMPLE_DATA, companyName, companyAddress, companyPhone, companyEmail, gstNumber, footerText }
  );

  if (loading) {
    return <div className="flex items-center justify-center h-full"><LoadingSpinner size="lg" message="Loading template..." /></div>;
  }

  return (
    <div className="page-content animate-[fadeIn_0.4s_ease] max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="copper-line mb-4" style={{ width: 48 }} />
          <h2 className="font-display text-3xl text-white">{editMode ? 'Edit Template' : 'Create New Template'}</h2>
          <p className="text-[#A1A1AA] text-sm mt-1">Design your bill template with HTML/CSS and live preview</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/templates')}>
          <ArrowLeft size={15} />Back
        </button>
      </div>

      <div className="space-y-6">
        {/* Template Name */}
        <SectionCard icon={Hash} title="Template Identity">
          <div className="form-group max-w-sm">
            <label className="label">Template Name *</label>
            <input
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Shubh Construction Modern"
            />
            {errors.name && <p className="form-error"><AlertCircle size={11} />{errors.name}</p>}
          </div>
        </SectionCard>

        {/* Company Info */}
        <SectionCard icon={Building2} title="Company Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Company Name *</label>
              <input className="input" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Your company name" />
              {errors.companyName && <p className="form-error">{errors.companyName}</p>}
            </div>
            <div className="form-group">
              <label className="label">Phone</label>
              <input className="input" value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input className="input" type="email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} placeholder="info@company.com" />
            </div>
            <div className="form-group">
              <label className="label">GST Number</label>
              <input className="input" value={gstNumber} onChange={e => setGstNumber(e.target.value)} placeholder="27AAAAA0000A1Z5" />
            </div>
            <div className="form-group md:col-span-2">
              <label className="label">Company Address</label>
              <textarea className="input" rows={2} value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} placeholder="Full address..." />
            </div>
          </div>
        </SectionCard>

        {/* Logo & Signature */}
        <SectionCard icon={Upload} title="Logo & Signature">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label mb-3 block">Company Logo</label>
              <label className="flex flex-col items-center gap-3 p-6 rounded-[8px] cursor-pointer transition-colors hover:border-[#B8754F]" style={{ border: '2px dashed #2A2F38', background: '#111418' }}>
                <Upload size={24} className="text-[#B8754F]" />
                <span className="text-sm text-[#A1A1AA]">{logoPath ? '✓ Logo uploaded' : 'Click to upload logo'}</span>
                <span className="text-xs text-[#71717A]">PNG, JPG, SVG up to 5MB</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>
            <div>
              <label className="label mb-3 block">Signature</label>
              <label className="flex flex-col items-center gap-3 p-6 rounded-[8px] cursor-pointer transition-colors hover:border-[#B8754F]" style={{ border: '2px dashed #2A2F38', background: '#111418' }}>
                <Upload size={24} className="text-[#B8754F]" />
                <span className="text-sm text-[#A1A1AA]">{signaturePath ? '✓ Signature uploaded' : 'Click to upload signature'}</span>
                <span className="text-xs text-[#71717A]">PNG, JPG, SVG up to 2MB</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
              </label>
            </div>
          </div>
        </SectionCard>

        {/* Footer */}
        <SectionCard icon={Hash} title="Footer Text">
          <div className="form-group">
            <label className="label">Footer / Terms</label>
            <textarea className="input" rows={3} value={footerText} onChange={e => setFooterText(e.target.value)} placeholder="Thank you for your business..." />
          </div>
        </SectionCard>

        {/* HTML Editor */}
        <SectionCard icon={Hash} title="Template HTML">
          <div className="mb-3">
            <p className="text-xs text-[#A1A1AA]">
              Use placeholders like <code className="text-[#B8754F] bg-[#22262E] px-1 py-0.5 rounded text-xs">{'{{customerName}}'}</code>, <code className="text-[#B8754F] bg-[#22262E] px-1 py-0.5 rounded text-xs">{'{{items}}'}</code>, <code className="text-[#B8754F] bg-[#22262E] px-1 py-0.5 rounded text-xs">{'{{grandTotal}}'}</code> etc. They will be replaced with real data when generating the PDF.
            </p>
          </div>
          <textarea
            className="input font-mono text-xs"
            rows={14}
            value={templateHtml}
            onChange={e => setTemplateHtml(e.target.value)}
            style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}
          />
          {errors.html && <p className="form-error mt-2"><AlertCircle size={11} />{errors.html}</p>}
        </SectionCard>

        {/* CSS Editor */}
        <SectionCard icon={Hash} title="Template CSS">
          <textarea
            className="input font-mono text-xs"
            rows={8}
            value={templateCss}
            onChange={e => setTemplateCss(e.target.value)}
            style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}
          />
        </SectionCard>

        {/* Action buttons */}
        <div className="flex items-center justify-between gap-4 card p-5">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye size={15} />
            {showPreview ? 'Hide Preview' : 'Live Preview'}
          </button>
          <div className="flex gap-3">
            <button className="btn btn-ghost" onClick={() => navigate('/templates')}>Cancel</button>
            <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
              {saving ? (
                <><div className="spinner" style={{ width: 16, height: 16 }} />Saving...</>
              ) : (
                <><Save size={16} />{editMode ? 'Save Changes' : 'Save Template'}</>
              )}
            </button>
          </div>
        </div>

        {/* Live Preview */}
        {showPreview && (
          <div className="card overflow-hidden">
            <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #2A2F38', background: '#191C21' }}>
              <Eye size={14} className="text-[#B8754F]" />
              <span className="text-sm font-semibold text-white">Live Preview (Sample Data)</span>
            </div>
            <div style={{ background: '#fff', minHeight: 400 }}>
              <iframe
                srcDoc={`<style>${templateCss}</style>${previewHtml}`}
                style={{ width: '100%', height: 700, border: 'none' }}
                title="Template Preview"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Default template HTML ────────────────────────────────
const DEFAULT_TEMPLATE_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>{{css}}</style>
</head>
<body>
<div class="invoice">
  <!-- Header -->
  <div class="header">
    <div class="company-info">
      <h1 class="company-name">{{companyName}}</h1>
      <p>{{companyAddress}}</p>
      <p>{{companyPhone}} | {{companyEmail}}</p>
      <p>GST: {{gstNumber}}</p>
    </div>
    <div class="invoice-meta">
      <h2>TAX INVOICE</h2>
      <p><strong>Bill No:</strong> {{billNumber}}</p>
      <p><strong>Date:</strong> {{billDate}}</p>
      <p><strong>Due:</strong> {{dueDate}}</p>
    </div>
  </div>

  <!-- Bill To -->
  <div class="bill-to">
    <h3>Bill To</h3>
    <p class="customer-name">{{customerName}}</p>
    <p>{{customerAddress}}</p>
    <p>{{customerMobile}}</p>
    <p>{{customerGST}}</p>
  </div>

  <!-- Items Table -->
  <table class="items-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit</th>
        <th>Rate</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      {{items}}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals">
    <div class="total-row">
      <span>Subtotal</span>
      <span>{{subtotal}}</span>
    </div>
    <div class="total-row">
      <span>Discount</span>
      <span>{{discount}}</span>
    </div>
    <div class="total-row">
      <span>GST</span>
      <span>{{tax}}</span>
    </div>
    <div class="total-row grand-total">
      <span>Grand Total</span>
      <span>{{grandTotal}}</span>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>{{footerText}}</p>
  </div>
</div>
</body>
</html>`;

const DEFAULT_TEMPLATE_CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #333; background: #fff; }
.invoice { max-width: 800px; margin: 0 auto; padding: 40px; }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 3px solid #B8754F; }
.company-name { font-size: 24px; font-weight: 700; color: #1a1a1a; margin-bottom: 6px; }
.company-info p { font-size: 12px; color: #555; line-height: 1.6; }
.invoice-meta { text-align: right; }
.invoice-meta h2 { font-size: 20px; color: #B8754F; font-weight: 700; margin-bottom: 8px; }
.invoice-meta p { font-size: 12px; color: #555; line-height: 1.8; }
.bill-to { background: #f9f6f3; border-left: 4px solid #B8754F; padding: 16px 20px; margin-bottom: 28px; border-radius: 4px; }
.bill-to h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #B8754F; margin-bottom: 8px; }
.customer-name { font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px; }
.bill-to p { font-size: 12px; color: #555; line-height: 1.6; }
.items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
.items-table th { background: #B8754F; color: white; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
.items-table th:last-child, .items-table td:last-child { text-align: right; }
.items-table th:first-child, .items-table td:first-child { text-align: center; width: 40px; }
.items-table td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
.items-table tbody tr:nth-child(even) { background: #fdf9f7; }
.totals { max-width: 280px; margin-left: auto; border: 1px solid #eee; border-radius: 6px; overflow: hidden; }
.total-row { display: flex; justify-content: space-between; padding: 8px 16px; border-bottom: 1px solid #eee; font-size: 13px; }
.total-row:last-child { border-bottom: none; }
.grand-total { background: #B8754F; color: white; font-weight: 700; font-size: 15px; padding: 12px 16px; }
.footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #999; }
`;
