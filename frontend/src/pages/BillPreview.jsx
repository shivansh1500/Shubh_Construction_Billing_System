import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  FolderOpen, Printer, Download, RotateCcw, ArrowLeft,
  X, FileText, CheckCircle,
} from 'lucide-react';
import { billsAPI } from '../services/api';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils';

export default function BillPreview() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [bill, setBill] = useState(null);
  const [pdfPath, setPdfPath] = useState(location.state?.pdfPath || null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    loadBill();
  }, [id]);

  async function loadBill() {
    try {
      const res = await billsAPI.getById(id);
      setBill(res.data);
      if (res.data.pdf_path) setPdfPath(res.data.pdf_path);
    } catch {
      addToast('Failed to load bill', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const res = await billsAPI.generatePDF(id);
      setPdfPath(res.data.pdf_path);
      addToast('PDF regenerated successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to regenerate PDF', 'error');
    } finally {
      setRegenerating(false);
    }
  }

  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');
  const serverBase = apiBase.replace(/\/api$/, '');

  function getPdfUrl() {
    if (pdfPath) {
      if (pdfPath.includes('/api/bills/')) return pdfPath;
      if (pdfPath.startsWith('http')) return pdfPath;
      if (pdfPath.startsWith('/')) return `${serverBase}${pdfPath}`;
    }
    return id ? `${apiBase}/bills/${id}/pdf` : '';
  }

  function handleOpenPDF() {
    const url = getPdfUrl();
    if (url) {
      window.open(url, '_blank');
    }
  }

  function handlePrint() {
    const url = getPdfUrl();
    if (url) {
      const win = window.open(url, '_blank');
      if (win) {
        win.addEventListener('load', () => win.print());
      }
    }
  }

  function handleDownloadPDF() {
    const url = getPdfUrl();
    if (url) {
      const downloadUrl = url.includes('?') ? `${url}&download=true` : `${url}?download=true`;
      window.open(downloadUrl, '_blank');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" message="Loading bill preview..." />
      </div>
    );
  }

  return (
    <div className="page-content animate-[fadeIn_0.4s_ease] max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="badge badge-copper">INVOICE PREVIEW</span>
            <span className="text-xs text-[#756B61] font-mono">•</span>
            <span className="text-xs text-[#A1A1AA] font-mono">{bill?.bill_number || ''}</span>
          </div>
          <h2 className="display-title text-white">Spatial Invoice Document</h2>
          {bill && (
            <p className="text-[#A1A1AA] text-sm mt-1">
              {bill.customer_name} · <strong className="text-white font-mono">{formatCurrency(bill.grand_total)}</strong>
            </p>
          )}
        </div>
        <button
          className="btn btn-ghost btn-pill btn-sm border border-[#756B61]/30"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={15} />
          Back
        </button>
      </div>

      {/* Success banner */}
      {pdfPath && (
        <div
          className="flex items-center gap-3 px-5 py-3.5 rounded-[10px] mb-6"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }}
        >
          <CheckCircle size={16} className="text-emerald-400" />
          <p className="text-sm text-emerald-300 font-body">Invoice verified and published. Ready for print or client dispatch.</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* PDF Preview */}
        <div className="xl:col-span-3">
          <div className="card overflow-hidden" style={{ minHeight: 600 }}>
            <div
              className="px-5 py-3 flex items-center gap-2"
              style={{ borderBottom: '1px solid #2A2F38', background: '#191C21' }}
            >
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-[#71717A] ml-2" style={{ fontFamily: 'JetBrains Mono' }}>
                {pdfPath ? pdfPath.split('/').pop() || pdfPath.split('\\').pop() : 'No PDF yet'}
              </span>
            </div>
            <div className="flex items-center justify-center" style={{ minHeight: 560, background: '#111418' }}>
              {pdfPath || bill?.pdf_url || bill?.pdf_public_id ? (
                <iframe
                  src={getPdfUrl()}
                  className="w-full"
                  style={{ height: 700, border: 'none' }}
                  title="Bill PDF Preview"
                />
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <FileText size={48} className="text-[#2A2F38]" />
                  <p className="text-[#71717A] text-sm">PDF not generated yet</p>
                  <button className="btn btn-primary" onClick={handleRegenerate}>
                    Generate PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions sidebar */}
        <div className="space-y-4">
          <div className="card p-5 border border-[#756B61]/30">
            <h3 className="text-xs font-semibold text-[#A1A1AA] mb-4 font-mono tracking-widest uppercase">Document Actions</h3>
            <div className="flex flex-col gap-3">
              <button
                className="btn btn-primary btn-pill w-full shadow-copper"
                onClick={handleOpenPDF}
                disabled={!pdfPath && !bill?.pdf_url && !bill?.pdf_public_id}
              >
                <FolderOpen size={15} />
                <span>Open / View PDF</span>
              </button>
              <button
                className="btn btn-secondary btn-pill w-full"
                onClick={handlePrint}
                disabled={!pdfPath && !bill?.pdf_url && !bill?.pdf_public_id}
              >
                <Printer size={15} />
                <span>Print Document</span>
              </button>
              <button
                className="btn btn-secondary btn-pill w-full"
                onClick={handleDownloadPDF}
                disabled={!pdfPath && !bill?.pdf_url && !bill?.pdf_public_id}
              >
                <Download size={15} />
                <span>Download / Save As</span>
              </button>
              <hr className="divider my-1 border-[#756B61]/20" />
              <button
                className="btn btn-secondary btn-pill w-full"
                onClick={handleRegenerate}
                disabled={regenerating}
              >
                {regenerating ? (
                  <><div className="spinner" style={{ width: 15, height: 15 }} />Regenerating...</>
                ) : (
                  <><RotateCcw size={15} />Regenerate PDF</>
                )}
              </button>
              <button
                className="btn btn-secondary btn-pill w-full"
                onClick={() => navigate(`/edit-bill/${id}`)}
              >
                Back to Edit
              </button>
              <button
                className="btn btn-ghost btn-pill w-full text-[#71717A]"
                onClick={() => navigate('/')}
              >
                <X size={15} />
                Close
              </button>
            </div>
          </div>

          {/* Bill summary */}
          {bill && (
            <div className="card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white mb-2">Bill Summary</h3>
              <div className="space-y-2">
                {[
                  ['Bill No.', bill.bill_number],
                  ['Date', formatDate(bill.bill_date)],
                  ['Customer', bill.customer_name],
                  ['Subtotal', formatCurrency(bill.subtotal)],
                  ['Discount', formatCurrency(bill.discount)],
                  ['Tax', formatCurrency(bill.tax)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-[#71717A]">{k}</span>
                    <span className="text-[#A1A1AA]">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold pt-2" style={{ borderTop: '1px solid #2A2F38' }}>
                  <span className="text-white">Total</span>
                  <span style={{ color: '#B8754F' }}>{formatCurrency(bill.grand_total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
