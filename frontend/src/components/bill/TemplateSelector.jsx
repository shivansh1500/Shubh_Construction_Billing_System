import React, { useEffect, useState } from 'react';
import { Palette, Check, Star } from 'lucide-react';
import { templatesAPI } from '../../services/api';

export default function TemplateSelector({ selectedId, onChange }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    templatesAPI.getAll()
      .then(res => {
        const list = res.data || [];
        setTemplates(list);
        // Auto-select default if nothing selected
        if (!selectedId) {
          const def = list.find(t => t.is_default) || list[0];
          if (def) onChange(def.id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[#A1A1AA] text-sm">
        <div className="spinner" style={{ width: 14, height: 14 }} />
        Loading templates...
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <p className="text-sm text-[#71717A]">No templates found. <a href="/templates/create" className="text-[#B8754F] hover:underline">Create one</a>.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {templates.map(t => {
        const isSelected = selectedId === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className="flex items-start gap-3 p-4 rounded-[10px] border text-left transition-all duration-200"
            style={{
              background: isSelected ? 'rgba(184,117,79,0.08)' : '#191C21',
              border: isSelected ? '1px solid rgba(184,117,79,0.5)' : '1px solid #2A2F38',
              boxShadow: isSelected ? '0 0 0 1px rgba(184,117,79,0.2)' : 'none',
            }}
          >
            <div
              className="w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0"
              style={{ background: isSelected ? 'rgba(184,117,79,0.2)' : '#22262E' }}
            >
              <Palette size={18} style={{ color: isSelected ? '#B8754F' : '#A1A1AA' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-white truncate">{t.name}</p>
                {t.is_default === 1 && (
                  <span className="badge badge-copper text-[9px] py-0.5 px-1.5">
                    <Star size={8} />Default
                  </span>
                )}
              </div>
              <p className="text-xs text-[#71717A] mt-0.5 truncate">{t.company_name || 'No company'}</p>
            </div>
            {isSelected && (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#B8754F' }}
              >
                <Check size={12} color="white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
