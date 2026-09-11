import React from 'react';

export default function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-[#22262E] border border-[#2A2F38] flex items-center justify-center mb-6">
          <Icon size={28} className="text-[#B8754F]" />
        </div>
      )}
      <h3 className="font-display text-xl text-white mb-2">{title}</h3>
      {subtitle && <p className="text-sm text-[#A1A1AA] mb-8 max-w-sm">{subtitle}</p>}
      {action && action}
    </div>
  );
}
