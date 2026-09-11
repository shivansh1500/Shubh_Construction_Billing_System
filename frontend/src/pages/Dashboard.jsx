import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, IndianRupee, TrendingUp, Calendar,
  FilePlus2, Eye, Palette, Plus, ArrowRight, Clock,
  Sparkles, Layers, Compass, ShieldCheck, ArrowUpRight,
} from 'lucide-react';
import { billsAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils';
import LoadingSpinner from '../components/LoadingSpinner';

function StatCard({ icon: Icon, label, value, sub, color = '#B8754F', delay = '0ms' }) {
  return (
    <div
      className="card p-6 flex flex-col justify-between relative overflow-hidden group hover:card-copper transition-all duration-300"
      style={{
        background: '#191C21',
        borderColor: 'rgba(117, 107, 97, 0.28)',
        minHeight: '140px',
        animationDelay: delay,
      }}
    >
      {/* Ambient hover gradient */}
      <div
        className="absolute top-0 right-0 w-36 h-36 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
          transform: 'translate(30%, -30%)',
        }}
      />

      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-[8px] flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
          style={{ background: 'rgba(184, 117, 79, 0.12)', border: '1px solid rgba(184, 117, 79, 0.25)' }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        <span
          className="text-[11px] font-semibold tracking-wider uppercase"
          style={{ fontFamily: 'JetBrains Mono', color: '#71717A' }}
        >
          {label}
        </span>
      </div>

      <div className="mt-4">
        <p className="stat-value text-white">{value}</p>
        {sub && <p className="text-xs text-[#A1A1AA] mt-1 font-body">{sub}</p>}
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, sub, onClick, variant = 'secondary' }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-[10px] text-left transition-all duration-200 group relative overflow-hidden ${
        variant === 'primary'
          ? 'border border-[#B8754F]/40 hover:border-[#B8754F] hover:shadow-[0_0_24px_rgba(184,117,79,0.25)]'
          : 'border border-[rgba(117,107,97,0.25)] hover:border-[#B8754F]/50 hover:bg-[#22262E]'
      }`}
      style={
        variant === 'primary'
          ? { background: 'linear-gradient(135deg, rgba(184,117,79,0.12) 0%, rgba(155,95,63,0.06) 100%)' }
          : { background: '#191C21' }
      }
    >
      <div
        className="w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
        style={
          variant === 'primary'
            ? { background: 'linear-gradient(135deg, #B8754F, #9B5F3F)', boxShadow: '0 2px 8px rgba(184,117,79,0.4)' }
            : { background: '#22262E', border: '1px solid rgba(117,107,97,0.3)' }
        }
      >
        <Icon size={18} color={variant === 'primary' ? 'white' : '#B8754F'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white tracking-wide">{label}</p>
        {sub && <p className="text-xs text-[#A1A1AA] mt-0.5 truncate font-body">{sub}</p>}
      </div>
      <ArrowRight size={15} className="text-[#71717A] group-hover:text-[#B8754F] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, today: 0, todayRevenue: 0, totalRevenue: 0 });
  const [recentBills, setRecentBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const [billsRes] = await Promise.all([
        billsAPI.getAll({ limit: 6, sort: 'created_at', order: 'desc' }),
      ]);
      const bills = billsRes.data.bills || [];
      const allBills = billsRes.data;

      const today = new Date().toISOString().split('T')[0];
      const todayBills = bills.filter(b => b.bill_date?.startsWith(today));

      setStats({
        total: allBills.total || bills.length,
        today: todayBills.length,
        todayRevenue: todayBills.reduce((s, b) => s + (b.grand_total || 0), 0),
        totalRevenue: allBills.totalRevenue || 0,
      });
      setRecentBills(bills.slice(0, 6));
    } catch (err) {
      console.error('Dashboard load error:', err);
      setRecentBills([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" message="Loading Studio Veda spatial overview..." />
      </div>
    );
  }

  return (
    <div className="page-content animate-[fadeIn_0.4s_ease] space-y-10 max-w-7xl mx-auto">
      {/* =========================================================================
          STUDIO VEDA - FLAGSHIP HERO SECTION
          "Craft An Authentic Living Space To Experience Timeless Architectural Poetics"
         ========================================================================= */}
      <section className="relative rounded-[16px] overflow-hidden p-8 md:p-12 card-hero border border-[#756B61]/40">
        {/* Subtle atmospheric radial lighting */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none opacity-40"
          style={{
            background: 'radial-gradient(circle, #B8754F 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />

        <div className="relative z-10 max-w-3xl">
          {/* Eyebrow badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="badge badge-copper">
              <Sparkles size={11} />
              STUDIO VEDA · SPATIAL DESIGN
            </span>
            <span className="text-xs text-[#756B61] font-mono hidden sm:inline">•</span>
            <span className="text-xs text-[#A1A1AA] font-mono tracking-wider hidden sm:inline uppercase">
              Shubh Construction Billing Engine
            </span>
          </div>

          {/* Core Visible Headings (Exact Source Spec) */}
          <h1 className="display-hero text-white mb-4 tracking-tight">
            Craft An Authentic Living Space To Experience{' '}
            <span className="italic text-[#B8754F] font-normal block sm:inline">
              Timeless Architectural Poetics
            </span>
          </h1>

          {/* Supporting Copy (Exact Source Spec) */}
          <p className="text-base md:text-lg text-[#A1A1AA] leading-relaxed mb-8 font-body max-w-2xl">
            Thoughtful atmospheres, raw materials, and welcoming layouts designed for precision civil construction, instant tax invoicing, and spatial permanence.
          </p>

          {/* Primary Call to Action Bar */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => navigate('/create-bill')}
              className="btn btn-primary btn-pill btn-lg shadow-copper flex items-center gap-2 group"
            >
              <FilePlus2 size={18} />
              <span>Craft New Invoice</span>
              <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>

            <button
              onClick={() => navigate('/templates')}
              className="btn btn-secondary btn-pill btn-lg flex items-center gap-2"
            >
              <Palette size={16} className="text-[#B8754F]" />
              <span>Explore Templates</span>
            </button>

            <div className="hidden md:flex items-center gap-2 px-4 py-3 rounded-full bg-[#15181D] border border-[#756B61]/30 ml-auto">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-[#A1A1AA]">
                Revenue: <strong className="text-white">{formatCurrency(stats.totalRevenue)}</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SPATIAL STAT METRICS GRID
         ========================================================================= */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-[#B8754F]" />
            <h3 className="text-sm font-semibold tracking-wider text-[#A1A1AA] uppercase font-mono">
              Live Ledger Metrics
            </h3>
          </div>
          <span className="text-xs text-[#71717A] font-mono">
            {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={FileText}
            label="Total Invoices"
            value={stats.total}
            sub="All time documented"
            color="#B8754F"
            delay="0ms"
          />
          <StatCard
            icon={Calendar}
            label="Today's Bills"
            value={stats.today}
            sub="Crafted today"
            color="#9B5F3F"
            delay="50ms"
          />
          <StatCard
            icon={IndianRupee}
            label="Today's Revenue"
            value={formatCurrency(stats.todayRevenue)}
            sub="Receipts generated today"
            color="#B8754F"
            delay="100ms"
          />
          <StatCard
            icon={TrendingUp}
            label="Cumulative Revenue"
            value={formatCurrency(stats.totalRevenue)}
            sub="Aggregate turnover"
            color="#C47F5A"
            delay="150ms"
          />
        </div>
      </section>

      {/* =========================================================================
          TWO-COLUMN ARCHITECTURAL CONTENT SECTION
         ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Recent Bills Ledger */}
        <div className="xl:col-span-2 card overflow-hidden border border-[#756B61]/25">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#756B61]/20 bg-[#15181D]/60">
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-[#B8754F]" />
              <h3 className="text-base font-semibold text-white tracking-wide">Recent Spatial Invoices</h3>
            </div>
            <button
              className="text-xs text-[#B8754F] hover:text-[#C47F5A] transition-colors flex items-center gap-1 font-mono tracking-wide"
              onClick={() => navigate('/bill-history')}
            >
              VIEW ARCHIVE <ArrowRight size={12} />
            </button>
          </div>

          {recentBills.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-4 text-center px-6">
              <div className="w-14 h-14 rounded-full bg-[#15181D] border border-[#756B61]/30 flex items-center justify-center">
                <FileText size={24} className="text-[#B8754F]" />
              </div>
              <div>
                <p className="text-white text-base font-medium">No bills in ledger yet</p>
                <p className="text-[#A1A1AA] text-xs mt-1">Begin by crafting your first architectural invoice</p>
              </div>
              <button
                className="btn btn-primary btn-pill btn-sm shadow-copper mt-2"
                onClick={() => navigate('/create-bill')}
              >
                <FilePlus2 size={14} />
                Craft First Bill
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#756B61]/15">
              {recentBills.map((bill) => (
                <div
                  key={bill.id || bill._id}
                  className="flex items-center px-6 py-4 gap-4 cursor-pointer hover:bg-[#22262E]/60 transition-colors group"
                  onClick={() => navigate(`/bill-preview/${bill.id || bill._id}`)}
                >
                  <div
                    className="w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0 transition-colors group-hover:border-[#B8754F]"
                    style={{ background: 'rgba(184,117,79,0.1)', border: '1px solid rgba(184,117,79,0.2)' }}
                  >
                    <FileText size={16} style={{ color: '#B8754F' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white font-mono tracking-wide group-hover:text-[#B8754F] transition-colors truncate">
                      {bill.bill_number}
                    </p>
                    <p className="text-xs text-[#A1A1AA] truncate mt-0.5">
                      {bill.customer_name} {bill.customer_mobile ? `· ${bill.customer_mobile}` : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-white font-mono">
                      {formatCurrency(bill.grand_total)}
                    </p>
                    <p className="text-xs text-[#71717A] mt-0.5 font-mono">
                      {formatDate(bill.bill_date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Quick Studio Actions & Veda Materials */}
        <div className="flex flex-col gap-6">
          {/* Quick Actions Card */}
          <div className="card p-6 border border-[#756B61]/25">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 font-mono tracking-wider uppercase">
              <Compass size={15} className="text-[#B8754F]" />
              Quick Studio Actions
            </h3>
            <div className="flex flex-col gap-3">
              <QuickAction
                icon={FilePlus2}
                label="Craft New Invoice"
                sub="Generate tax-compliant bill"
                onClick={() => navigate('/create-bill')}
                variant="primary"
              />
              <QuickAction
                icon={Eye}
                label="Invoice Ledger"
                sub={`${stats.total} archived records`}
                onClick={() => navigate('/bill-history')}
              />
              <QuickAction
                icon={Palette}
                label="Spatial Templates"
                sub="Custom bill styling"
                onClick={() => navigate('/templates')}
              />
              <QuickAction
                icon={Plus}
                label="Create Template"
                sub="Build bespoke design"
                onClick={() => navigate('/templates/create')}
              />
            </div>
          </div>

          {/* Raw Materials & Poetics Card */}
          <div
            className="rounded-[12px] p-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(184,117,79,0.08) 0%, rgba(25,28,33,0.95) 100%)',
              border: '1px solid rgba(117, 107, 97, 0.35)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={14} className="text-[#B8754F]" />
              <p
                className="text-[11px] font-semibold tracking-widest uppercase"
                style={{ fontFamily: 'JetBrains Mono', color: '#B8754F' }}
              >
                Architectural Integrity
              </p>
            </div>
            <h4 className="font-display text-lg text-white mb-2">Raw Materials & Precision</h4>
            <p className="text-xs text-[#A1A1AA] leading-relaxed font-body">
              "Concrete, timber, terracotta, and structural steel — precision in civil execution, absolute transparency in client billing."
            </p>
            <div className="mt-4 pt-3 border-t border-[#756B61]/20 flex items-center justify-between text-[11px] font-mono text-[#71717A]">
              <span>Cloudinary Storage: Ready</span>
              <span>MongoDB Atlas: Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
