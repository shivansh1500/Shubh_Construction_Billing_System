import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, Filter, Eye, Edit2, Trash2, FileText,
  FilePlus2, RefreshCw, Calendar, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { billsAPI } from '../services/api';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatDate, debounce } from '../utils';

const PAGE_SIZE = 20;

export default function BillHistory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const [bills, setBills] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [regeneratingId, setRegeneratingId] = useState(null);

  const loadBills = useCallback(debounce(async (params) => {
    setLoading(true);
    try {
      const res = await billsAPI.getAll(params);
      setBills(res.data.bills || []);
      setTotal(res.data.total || 0);
    } catch {
      addToast('Failed to load bills', 'error');
    } finally {
      setLoading(false);
    }
  }, 300), []);

  useEffect(() => {
    const params = {
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      sort: 'created_at',
      order: 'desc',
    };
    loadBills(params);
  }, [page, search, dateFrom, dateTo]);

  async function handleDelete(confirmed) {
    if (!confirmed) { setDeleteId(null); return; }
    try {
      await billsAPI.delete(deleteId);
      addToast('Bill deleted successfully', 'success');
      setDeleteId(null);
      // Reload
      const params = { page, limit: PAGE_SIZE, search: search || undefined };
      loadBills(params);
    } catch {
      addToast('Failed to delete bill', 'error');
      setDeleteId(null);
    }
  }

  async function handleRegenerate(billId) {
    setRegeneratingId(billId);
    try {
      const res = await billsAPI.generatePDF(billId);
      addToast('PDF regenerated successfully', 'success');
      navigate(`/bill-preview/${billId}`, { state: { pdfPath: res.data.pdf_path } });
    } catch {
      addToast('Failed to regenerate PDF', 'error');
    } finally {
      setRegeneratingId(null);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="page-content animate-[fadeIn_0.4s_ease] max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge badge-copper">ARCHIVE LEDGER</span>
          <span className="text-xs text-[#756B61] font-mono">•</span>
          <span className="text-xs text-[#A1A1AA] font-mono">{total} bill{total !== 1 ? 's' : ''} recorded</span>
        </div>
        <h2 className="display-title text-white">Spatial Invoice Ledger</h2>
        <p className="text-[#A1A1AA] text-sm mt-1">Search, inspect, print, and regenerate tax invoice records from persistent storage.</p>
      </div>

      {/* Search & Filters */}
      <div className="card p-5 mb-6 border border-[#756B61]/30">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]" />
            <input
              className="input pl-10 font-body"
              placeholder="Search by invoice number, customer name, or mobile..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[#B8754F]" />
            <input
              className="input font-mono text-xs"
              type="date"
              style={{ width: 145 }}
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              title="From date"
            />
            <span className="text-[#71717A] text-xs font-mono">to</span>
            <input
              className="input font-mono text-xs"
              type="date"
              style={{ width: 145 }}
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(1); }}
              title="To date"
            />
            {(search || dateFrom || dateTo) && (
              <button
                className="btn btn-ghost btn-sm text-[#71717A] font-mono text-xs"
                onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setPage(1); }}
              >
                Clear
              </button>
            )}
          </div>
          <button
            className="btn btn-primary btn-pill btn-sm shadow-copper"
            onClick={() => navigate('/create-bill')}
          >
            <FilePlus2 size={14} />
            <span>Craft Bill</span>
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="md" message="Loading bills..." />
        </div>
      ) : bills.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={search ? 'No bills found' : 'No bills yet'}
          subtitle={search ? `No results for "${search}"` : 'Create your first bill to get started.'}
          action={
            !search && (
              <button className="btn btn-primary" onClick={() => navigate('/create-bill')}>
                <FilePlus2 size={15} />
                Create Your First Bill
              </button>
            )
          }
        />
      ) : (
        <>
          <div className="table-container mb-4">
            <table className="table">
              <thead>
                <tr>
                  <th>Bill Number</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Mobile</th>
                  <th className="text-right">Amount</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map(bill => {
                  const bId = bill._id || bill.id;
                  return (
                    <tr key={bId}>
                      <td>
                        <span
                          className="font-semibold text-white cursor-pointer hover:text-[#B8754F] transition-colors"
                          style={{ fontFamily: 'JetBrains Mono', fontSize: 13 }}
                          onClick={() => navigate(`/bill-preview/${bId}`)}
                        >
                          {bill.bill_number}
                        </span>
                      </td>
                      <td className="text-[#A1A1AA] text-sm">{formatDate(bill.bill_date)}</td>
                      <td>
                        <div>
                          <p className="text-sm text-white font-medium">{bill.customer_name}</p>
                          {bill.customer_address && (
                            <p className="text-xs text-[#71717A] truncate max-w-[160px]">{bill.customer_address}</p>
                          )}
                        </div>
                      </td>
                      <td className="text-[#A1A1AA] text-sm">{bill.customer_mobile || '-'}</td>
                      <td className="text-right">
                        <span className="font-semibold text-white">{formatCurrency(bill.grand_total)}</span>
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            title="View"
                            className="btn btn-ghost btn-sm p-1.5"
                            onClick={() => navigate(`/bill-preview/${bId}`)}
                          >
                            <Eye size={14} className="text-[#A1A1AA] hover:text-white" />
                          </button>
                          <button
                            title="Edit"
                            className="btn btn-ghost btn-sm p-1.5"
                            onClick={() => navigate(`/edit-bill/${bId}`)}
                          >
                            <Edit2 size={14} className="text-[#A1A1AA] hover:text-[#B8754F]" />
                          </button>
                          <button
                            title="Regenerate PDF"
                            className="btn btn-ghost btn-sm p-1.5"
                            onClick={() => handleRegenerate(bId)}
                            disabled={regeneratingId === bId}
                          >
                            <RefreshCw size={14} className={`text-[#A1A1AA] hover:text-green-400 ${regeneratingId === bId ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            title="Delete"
                            className="btn btn-ghost btn-sm p-1.5"
                            onClick={() => setDeleteId(bId)}
                          >
                            <Trash2 size={14} className="text-[#A1A1AA] hover:text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#71717A]">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-sm text-white px-2">{page} / {totalPages}</span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Bill"
        message="Are you sure you want to delete this bill? This action cannot be undone. The associated PDF will also be removed."
        confirmText="Delete Bill"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => handleDelete(true)}
        onCancel={() => handleDelete(false)}
      />
    </div>
  );
}
