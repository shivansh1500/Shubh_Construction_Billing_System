import React, { useEffect, useState } from 'react';
import {
  Building2, Phone, Mail, MapPin, Hash, Save,
  Upload, IndianRupee, FileText, AlertCircle, HardDriveDownload,
} from 'lucide-react';
import { settingsAPI, uploadAPI, backupAPI } from '../services/api';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

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

export default function Settings() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [defaultTaxRate, setDefaultTaxRate] = useState('18');
  const [billPrefix, setBillPrefix] = useState('SC');
  const [startingNumber, setStartingNumber] = useState('1');
  const [logoPath, setLogoPath] = useState('');
  const [signaturePath, setSignaturePath] = useState('');
  const [backupPath, setBackupPath] = useState('');
  const [backingUp, setBackingUp] = useState(false);

  useEffect(() => {
    settingsAPI.get()
      .then(res => {
        const s = res.data;
        setCompanyName(s.company_name || '');
        setCompanyAddress(s.company_address || '');
        setCompanyPhone(s.company_phone || '');
        setCompanyEmail(s.company_email || '');
        setGstNumber(s.gst_number || '');
        setCurrency(s.currency || '₹');
        setDefaultTaxRate(String(s.default_tax_rate || 18));
        setBillPrefix(s.bill_prefix || 'SC');
        setStartingNumber(String(s.starting_number || 1));
        setLogoPath(s.logo_path || '');
        setSignaturePath(s.signature_path || '');
      })
      .catch(() => addToast('Failed to load settings', 'error'))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const res = await uploadAPI.logo(fd);
      setLogoPath(res.data.path);
      addToast('Logo uploaded successfully', 'success');
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
      addToast('Signature uploaded successfully', 'success');
    } catch {
      addToast('Failed to upload signature', 'error');
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await settingsAPI.update({
        company_name: companyName.trim(),
        company_address: companyAddress.trim(),
        company_phone: companyPhone.trim(),
        company_email: companyEmail.trim(),
        gst_number: gstNumber.trim(),
        currency: currency,
        default_tax_rate: parseFloat(defaultTaxRate) || 18,
        bill_prefix: billPrefix.trim() || 'SC',
        starting_number: parseInt(startingNumber) || 1,
        logo_path: logoPath,
        signature_path: signaturePath,
      });
      addToast('Settings saved successfully', 'success');
    } catch {
      addToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleLocalBackup() {
    if (!backupPath.trim()) {
      addToast('Please enter a backup destination path.', 'error');
      return;
    }
    setBackingUp(true);
    try {
      const res = await backupAPI.createLocal(backupPath.trim());
      const s = res.data.summary || {};
      addToast(`Backup created successfully at ${res.data.backupFolder} (${s.billsCount || 0} bills, ${s.pdfsDownloaded || 0} PDFs)`, 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Local backup failed. Please verify the folder path.', 'error');
    } finally {
      setBackingUp(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full"><LoadingSpinner size="lg" message="Loading settings..." /></div>;
  }

  return (
    <div className="page-content animate-[fadeIn_0.4s_ease] max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge badge-copper">STUDIO CONFIGURATION</span>
          <span className="text-xs text-[#756B61] font-mono">•</span>
          <span className="text-xs text-[#A1A1AA] font-mono uppercase">Settings & Vault</span>
        </div>
        <h2 className="display-title text-white">Studio Settings</h2>
        <p className="text-[#A1A1AA] text-sm mt-1">Configure company identity, GSTIN, currency tokens, and on-demand local backup vault.</p>
      </div>

      <div className="space-y-6">
        <SectionCard icon={Building2} title="Company Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group md:col-span-2">
              <label className="label">Company Name</label>
              <input className="input" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Shubh Construction" />
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
              <textarea className="input" rows={3} value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} placeholder="Full address..." />
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={IndianRupee} title="Business Settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Currency Symbol</label>
              <select className="input" value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="₹">₹ Indian Rupee (INR)</option>
                <option value="$">$ US Dollar (USD)</option>
                <option value="€">€ Euro (EUR)</option>
                <option value="£">£ British Pound (GBP)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Default Tax Rate (%)</label>
              <input className="input" type="number" min="0" max="100" value={defaultTaxRate} onChange={e => setDefaultTaxRate(e.target.value)} placeholder="18" />
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={FileText} title="Bill Numbering">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Bill Number Prefix</label>
              <input className="input" value={billPrefix} onChange={e => setBillPrefix(e.target.value)} placeholder="SC" />
              <p className="text-xs text-[#71717A] mt-1">Bills will be numbered: {billPrefix || 'SC'}-0001, {billPrefix || 'SC'}-0002...</p>
            </div>
            <div className="form-group">
              <label className="label">Starting Number</label>
              <input className="input" type="number" min="1" value={startingNumber} onChange={e => setStartingNumber(e.target.value)} placeholder="1" />
              <p className="text-xs text-[#71717A] mt-1">Only applies if no bills exist yet</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={Upload} title="Logo & Signature">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label mb-3 block">Company Logo</label>
              {logoPath && (
                <div className="mb-3 p-2 rounded bg-[#22262E] border border-[#2A2F38]">
                  <img src={logoPath.startsWith('http') ? logoPath : `http://localhost:3001/uploads/${logoPath.split('/').pop()}`} alt="Logo" className="max-h-16 object-contain" />
                </div>
              )}
              <label className="flex flex-col items-center gap-2 p-5 rounded-[8px] cursor-pointer hover:border-[#B8754F] transition-colors" style={{ border: '2px dashed #2A2F38', background: '#111418' }}>
                <Upload size={20} className="text-[#B8754F]" />
                <span className="text-sm text-[#A1A1AA]">{logoPath ? 'Change logo' : 'Upload logo'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>
            <div>
              <label className="label mb-3 block">Signature</label>
              {signaturePath && (
                <div className="mb-3 p-2 rounded bg-[#22262E] border border-[#2A2F38]">
                  <img src={signaturePath.startsWith('http') ? signaturePath : `http://localhost:3001/uploads/${signaturePath.split('/').pop()}`} alt="Signature" className="max-h-16 object-contain" />
                </div>
              )}
              <label className="flex flex-col items-center gap-2 p-5 rounded-[8px] cursor-pointer hover:border-[#B8754F] transition-colors" style={{ border: '2px dashed #2A2F38', background: '#111418' }}>
                <Upload size={20} className="text-[#B8754F]" />
                <span className="text-sm text-[#A1A1AA]">{signaturePath ? 'Change signature' : 'Upload signature'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
              </label>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={HardDriveDownload} title="Manual Local Backup">
          <div className="space-y-4">
            <p className="text-xs text-[#A1A1AA]">
              Export all MongoDB collections (settings, templates, bills) to JSON and download every generated PDF from Cloudinary to a local directory on your machine.
            </p>
            <div className="form-group">
              <label className="label">Local Folder Path</label>
              <div className="flex gap-3">
                <input
                  className="input flex-1"
                  value={backupPath}
                  onChange={e => setBackupPath(e.target.value)}
                  placeholder="e.g. /Users/username/Desktop/BillingBackups"
                />
                <button
                  type="button"
                  className="btn btn-secondary flex-shrink-0"
                  onClick={handleLocalBackup}
                  disabled={backingUp}
                >
                  {backingUp ? (
                    <><div className="spinner" style={{ width: 15, height: 15 }} />Backing up...</>
                  ) : (
                    <><HardDriveDownload size={15} />Backup Now</>
                  )}
                </button>
              </div>
              <p className="text-xs text-[#71717A] mt-1">An on-demand timestamped subfolder will be created inside this folder.</p>
            </div>
          </div>
        </SectionCard>

        {/* Save button */}
        <div className="flex justify-end">
          <button className="btn btn-primary btn-pill btn-lg shadow-copper" onClick={handleSave} disabled={saving}>
            {saving ? (
              <><div className="spinner" style={{ width: 16, height: 16 }} />Saving Settings...</>
            ) : (
              <><Save size={16} />Save Studio Settings</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
