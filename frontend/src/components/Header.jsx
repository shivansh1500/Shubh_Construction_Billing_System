import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FilePlus2, ChevronRight, Sparkles } from 'lucide-react';

const routeTitles = {
  '/': { title: 'Spatial Overview', sub: 'Thoughtful atmospheres, raw materials, and welcoming layouts' },
  '/create-bill': { title: 'Craft New Invoice', sub: 'Generate authentic billing documents with architectural clarity' },
  '/bill-history': { title: 'Invoice Ledger', sub: 'Indexed archives of all spatial construction transactions' },
  '/templates': { title: 'Spatial Templates', sub: 'Curate and customize architectural invoice poetics' },
  '/settings': { title: 'Studio Settings', sub: 'Configure company identity, GSTIN, and Cloudinary storage' },
  '/backup': { title: 'Vault & Backup', sub: 'Local snapshot backups and Cloudinary asset exports' },
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const route = Object.entries(routeTitles).find(([key]) =>
    key === '/' ? location.pathname === '/' : location.pathname.startsWith(key)
  );
  const { title, sub } = route?.[1] || { title: 'Studio Veda', sub: 'Spatial Construction Suite' };

  return (
    <header
      className="flex-shrink-0 flex items-center justify-between px-10 py-4 z-10"
      style={{
        background: 'rgba(11, 13, 16, 0.75)',
        borderBottom: '1px solid rgba(117, 107, 97, 0.28)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        minHeight: 76,
      }}
    >
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display font-medium text-white leading-tight tracking-wide">{title}</h1>
          <span className="badge badge-copper text-[10px] hidden sm:inline-flex">
            <Sparkles size={10} />
            Shubh Construction Billing System
          </span>
        </div>
        {sub && <p className="text-xs text-[#A1A1AA] mt-0.5 max-w-xl truncate font-body">{sub}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Breadcrumb */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#71717A]" style={{ fontFamily: 'JetBrains Mono' }}>
          <span></span>
          <ChevronRight size={12} className="text-[#756B61]" />
          <span style={{ color: '#B8754F' }}>{title.toUpperCase()}</span>
        </div>

        {/* Quick action button */}
        {location.pathname !== '/create-bill' && (
          <button
            className="btn btn-primary btn-pill btn-sm shadow-copper"
            onClick={() => navigate('/create-bill')}
          >
            <FilePlus2 size={14} />
            <span>Craft Bill</span>
          </button>
        )}
      </div>
    </header>
  );
}
