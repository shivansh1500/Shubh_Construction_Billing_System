import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus2,
  FileText,
  Palette,
  Settings as SettingsIcon,
  HardDriveDownload,
  Sparkles,
  ChevronRight,
  Compass,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Spatial Overview', icon: LayoutDashboard, exact: true },
  { to: '/create-bill', label: 'Craft New Bill', icon: FilePlus2 },
  { to: '/bill-history', label: 'Invoice Ledger', icon: FileText },
  { to: '/templates', label: 'Spatial Templates', icon: Palette },
  { to: '/settings', label: 'Studio Settings', icon: SettingsIcon },
  { to: '/backup', label: 'Vault & Backup', icon: HardDriveDownload },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside
      className="w-64 flex-shrink-0 flex flex-col h-full overflow-hidden z-20"
      style={{
        background: '#0B0D10',
        borderRight: '1px solid rgba(117, 107, 97, 0.28)',
      }}
    >
      {/* Brand Header */}
      <div className="px-6 py-6" style={{ borderBottom: '1px solid rgba(117, 107, 97, 0.2)' }}>
        <div className="flex items-center gap-3">
          {/* Architectural Veda Monogram */}
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #B8754F 0%, #9B5F3F 100%)',
              boxShadow: '0 0 16px rgba(184, 117, 79, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <span className="font-display text-2xl font-normal text-white italic tracking-tighter">V</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-display text-xl font-medium text-white tracking-wide leading-none">Studio Veda</h2>
            </div>
            <p
              className="text-[10px] leading-tight mt-1 truncate"
              style={{ fontFamily: 'JetBrains Mono', color: '#B8754F', letterSpacing: '0.08em' }}
            >
              SHUBH · SPATIAL BILLING
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-1.5">
        <div className="px-3 mb-3 flex items-center justify-between">
          <span
            className="text-[10px] font-semibold tracking-widest uppercase"
            style={{ fontFamily: 'JetBrains Mono', color: '#71717A' }}
          >
            Spatial Navigation
          </span>
          <Compass size={11} className="text-[#756B61]" />
        </div>

        {navItems.map(({ to, label, icon: Icon, exact }) => {
          const isActive = exact
            ? location.pathname === to
            : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? 'text-white'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-[#191C21]'
              }`}
              style={
                isActive
                  ? {
                      background: 'linear-gradient(135deg, rgba(184,117,79,0.16) 0%, rgba(155,95,63,0.08) 100%)',
                      border: '1px solid rgba(184,117,79,0.35)',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                    }
                  : { border: '1px solid transparent' }
              }
            >
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                  style={{ background: '#B8754F', boxShadow: '0 0 8px #B8754F' }}
                />
              )}

              <Icon
                size={16}
                className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                style={{ color: isActive ? '#B8754F' : '#A1A1AA' }}
              />
              <span className="flex-1 font-body text-[13px] tracking-wide">{label}</span>

              {isActive && (
                <ChevronRight size={13} style={{ color: '#B8754F' }} />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Architectural Philosophy Card */}
      <div className="p-3">
        <div
          className="p-3.5 rounded-[10px] relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #15181D 0%, #101215 100%)',
            border: '1px solid rgba(117, 107, 97, 0.3)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={12} className="text-[#B8754F]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#B8754F]">Veda Poetics</span>
          </div>
          <p className="text-[11px] text-[#A1A1AA] leading-relaxed italic font-display">
            "Crafting authentic spaces to experience timeless architectural poetics."
          </p>
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(117, 107, 97, 0.2)' }}
      >
        <p className="text-[10px] text-[#71717A]" style={{ fontFamily: 'JetBrains Mono' }}>
          v2.0 · MongoDB Active
        </p>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400 font-mono">Ready</span>
        </div>
      </div>
    </aside>
  );
}
