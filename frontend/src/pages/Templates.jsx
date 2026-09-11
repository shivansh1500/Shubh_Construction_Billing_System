import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Star, Eye, Palette, Check } from 'lucide-react';
import { templatesAPI } from '../services/api';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';

function TemplateCard({ template, onSetDefault, onDelete, onEdit, onPreview }) {
  const isDefault = template.is_default === 1;
  return (
    <div
      className="card overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
      style={isDefault ? { border: '1px solid rgba(184,117,79,0.5)', boxShadow: '0 0 24px rgba(184,117,79,0.18)' } : { border: '1px solid rgba(117, 107, 97, 0.28)' }}
    >
      {/* Color strip */}
      <div
        className="h-2"
        style={{ background: isDefault ? 'linear-gradient(90deg, #B8754F, #9B5F3F)' : '#2A2F38' }}
      />

      {/* Card header */}
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(184,117,79,0.1)', border: '1px solid rgba(184,117,79,0.2)' }}
          >
            <Palette size={22} style={{ color: '#B8754F' }} />
          </div>
          <div className="flex items-center gap-2">
            {isDefault ? (
              <span className="badge badge-copper">
                <Star size={9} />
                Default
              </span>
            ) : (
              <span className="badge badge-inactive">Inactive</span>
            )}
          </div>
        </div>

        <h3 className="font-display text-lg text-white mb-1">{template.name}</h3>
        {template.company_name && (
          <p className="text-xs text-[#A1A1AA] mb-1">{template.company_name}</p>
        )}
        {template.company_phone && (
          <p className="text-xs text-[#71717A]">{template.company_phone}</p>
        )}
      </div>

      {/* Actions */}
      <div
        className="px-5 py-4 flex items-center gap-2"
        style={{ borderTop: '1px solid #2A2F38', background: '#111418' }}
      >
        <button className="btn btn-secondary btn-sm flex-1" onClick={() => onPreview(template)}>
          <Eye size={13} />
          Preview
        </button>
        <button className="btn btn-secondary btn-sm flex-1" onClick={() => onEdit(template.id)}>
          <Edit2 size={13} />
          Edit
        </button>
        {!isDefault && (
          <button
            className="btn btn-ghost btn-sm"
            title="Set as Default"
            onClick={() => onSetDefault(template.id)}
          >
            <Star size={13} className="text-[#A1A1AA] hover:text-[#B8754F]" />
          </button>
        )}
        <button
          className="btn btn-ghost btn-sm"
          title="Delete"
          onClick={() => onDelete(template)}
        >
          <Trash2 size={13} className="text-[#71717A] hover:text-red-400" />
        </button>
      </div>
    </div>
  );
}

export default function Templates() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  useEffect(() => { loadTemplates(); }, []);

  async function loadTemplates() {
    try {
      const res = await templatesAPI.getAll();
      setTemplates(res.data || []);
    } catch {
      addToast('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSetDefault(id) {
    try {
      await templatesAPI.setDefault(id);
      addToast('Default template updated', 'success');
      loadTemplates();
    } catch {
      addToast('Failed to set default', 'error');
    }
  }

  async function handleDelete(confirmed) {
    if (!confirmed) { setDeleteTarget(null); return; }
    if (templates.length <= 1) {
      addToast('Cannot delete the only template.', 'error');
      setDeleteTarget(null);
      return;
    }
    if (deleteTarget.is_default) {
      addToast('Please set another template as default before deleting this one.', 'warning');
      setDeleteTarget(null);
      return;
    }
    try {
      await templatesAPI.delete(deleteTarget.id);
      addToast('Template deleted', 'success');
      setDeleteTarget(null);
      loadTemplates();
    } catch {
      addToast('Failed to delete template', 'error');
      setDeleteTarget(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" message="Loading templates..." />
      </div>
    );
  }

  return (
    <div className="page-content animate-[fadeIn_0.4s_ease] max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-copper">SPATIAL TEMPLATES</span>
            <span className="text-xs text-[#756B61] font-mono">•</span>
            <span className="text-xs text-[#A1A1AA] font-mono">{templates.length} design{templates.length !== 1 ? 's' : ''} available</span>
          </div>
          <h2 className="display-title text-white">Spatial Design Templates</h2>
          <p className="text-[#A1A1AA] text-sm mt-1">Curate invoice poetics, typography, company branding, and tax layout styles.</p>
        </div>
        <button className="btn btn-primary btn-pill btn-sm shadow-copper" onClick={() => navigate('/templates/create')}>
          <Plus size={15} />
          <span>Create Template</span>
        </button>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={Palette}
          title="No templates yet"
          subtitle="Create a template to define how your bills will look when printed."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/templates/create')}>
              <Plus size={15} />
              Create Template
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {templates.map(t => (
            <TemplateCard
              key={t.id}
              template={t}
              onSetDefault={handleSetDefault}
              onDelete={setDeleteTarget}
              onEdit={id => navigate(`/templates/edit/${id}`)}
              onPreview={t => setPreviewTemplate(t)}
            />
          ))}
        </div>
      )}

      {/* Preview modal */}
      {previewTemplate && (
        <div className="dialog-overlay" onClick={() => setPreviewTemplate(null)}>
          <div
            className="dialog-content"
            style={{ maxWidth: 560 }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-display text-xl text-white mb-1">{previewTemplate.name}</h3>
            <p className="text-sm text-[#A1A1AA] mb-4">Template preview — sample data</p>
            <div
              className="rounded-[8px] p-4 text-xs"
              style={{ background: '#111418', border: '1px solid #2A2F38', fontFamily: 'JetBrains Mono', color: '#A1A1AA', maxHeight: 320, overflowY: 'auto' }}
            >
              <p><strong style={{ color: '#B8754F' }}>Company:</strong> {previewTemplate.company_name || 'N/A'}</p>
              <p><strong style={{ color: '#B8754F' }}>Phone:</strong> {previewTemplate.company_phone || 'N/A'}</p>
              <p><strong style={{ color: '#B8754F' }}>Email:</strong> {previewTemplate.company_email || 'N/A'}</p>
              <p><strong style={{ color: '#B8754F' }}>GST:</strong> {previewTemplate.gst_number || 'N/A'}</p>
              <p className="mt-3"><strong style={{ color: '#B8754F' }}>Address:</strong></p>
              <p>{previewTemplate.company_address || 'N/A'}</p>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button className="btn btn-secondary btn-sm" onClick={() => setPreviewTemplate(null)}>Close</button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => { setPreviewTemplate(null); navigate(`/templates/edit/${previewTemplate.id}`); }}
              >
                <Edit2 size={13} />Edit
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Template"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={() => handleDelete(true)}
        onCancel={() => handleDelete(false)}
      />
    </div>
  );
}
