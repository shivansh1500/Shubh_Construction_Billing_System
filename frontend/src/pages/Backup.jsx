import React, { useState } from 'react';
import {
  HardDriveDownload, Upload, FolderOpen, AlertTriangle,
  CheckCircle, Shield, Clock,
} from 'lucide-react';
import { backupAPI } from '../services/api';
import { useToast } from '../components/Toast';

export default function Backup() {
  const { addToast } = useToast();
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [backupPath, setBackupPath] = useState('');
  const [restorePath, setRestorePath] = useState('');
  const [lastBackup, setLastBackup] = useState(null);
  const [showRestoreWarning, setShowRestoreWarning] = useState(false);

  async function handleBackup() {
    if (!backupPath.trim()) {
      addToast('Please enter a backup destination path.', 'error');
      return;
    }
    setBackingUp(true);
    try {
      const res = await backupAPI.create(backupPath.trim());
      setLastBackup(new Date().toLocaleString('en-IN'));
      addToast(`Backup created successfully at: ${res.data.backup_file}`, 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Backup failed. Please check the path and try again.', 'error');
    } finally {
      setBackingUp(false);
    }
  }

  async function handleRestore() {
    if (!restorePath.trim()) {
      addToast('Please enter the backup file path.', 'error');
      return;
    }
    setRestoring(true);
    setShowRestoreWarning(false);
    try {
      await backupAPI.restore(restorePath.trim());
      addToast('Data restored successfully! Please restart the application.', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Restore failed. Please check the file path and try again.', 'error');
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="page-content animate-[fadeIn_0.4s_ease] max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge badge-copper">DATA REPOSITORIES</span>
          <span className="text-xs text-[#756B61] font-mono">•</span>
          <span className="text-xs text-[#A1A1AA] font-mono uppercase">Vault Security</span>
        </div>
        <h2 className="display-title text-white">Vault & Backup</h2>
        <p className="text-[#A1A1AA] text-sm mt-1">Export local snapshots and preserve billing archives with spatial integrity.</p>
      </div>

      <div className="space-y-6">
        {/* Info card */}
        <div
          className="flex items-start gap-4 p-5 rounded-[10px]"
          style={{ background: 'rgba(184,117,79,0.06)', border: '1px solid rgba(184,117,79,0.3)' }}
        >
          <Shield size={20} className="text-[#B8754F] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-white mb-1">What's included in a snapshot?</p>
            <ul className="text-xs text-[#A1A1AA] space-y-1">
              <li>• MongoDB collections (settings, templates, bills with embedded items)</li>
              <li>• Cloudinary invoices and downloaded local PDF copies</li>
              <li>• Uploaded logos, authorized signatures, and metadata</li>
              <li>• Spatial template configurations</li>
            </ul>
          </div>
        </div>

        {/* Backup section */}
        <div className="card p-6 border border-[#756B61]/30">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <HardDriveDownload size={18} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">Generate Vault Snapshot</h3>
              <p className="text-xs text-[#A1A1AA]">Export a complete ZIP archive of your database and files</p>
            </div>
          </div>

          <div className="form-group mb-4">
            <label className="label">Backup Destination Folder</label>
            <input
              className="input font-body"
              value={backupPath}
              onChange={e => setBackupPath(e.target.value)}
              placeholder="e.g. /Users/username/Desktop/Backups"
            />
            <p className="text-xs text-[#71717A] mt-1 font-mono">Enter the destination directory where the snapshot ZIP will be written</p>
          </div>

          <button
            className="btn btn-primary btn-pill shadow-copper"
            onClick={handleBackup}
            disabled={backingUp}
          >
            {backingUp ? (
              <><div className="spinner" style={{ width: 15, height: 15 }} />Creating Archive...</>
            ) : (
              <><HardDriveDownload size={15} />Export Vault Snapshot</>
            )}
          </button>

          {lastBackup && (
            <div className="mt-4 flex items-center gap-2 text-xs text-green-400">
              <CheckCircle size={13} />
              Last backup: {lastBackup}
            </div>
          )}
        </div>

        {/* Restore section */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <Upload size={18} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Restore from Backup</h3>
              <p className="text-xs text-[#A1A1AA]">Restore all data from a previous backup file</p>
            </div>
          </div>

          <div
            className="flex items-start gap-3 p-4 rounded-[8px] mb-5"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <AlertTriangle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">
              <strong>Warning:</strong> Restoring will overwrite all current data. This action cannot be undone. Make sure to create a backup of your current data first.
            </p>
          </div>

          <div className="form-group mb-4">
            <label className="label">Backup ZIP File Path</label>
            <input
              className="input"
              value={restorePath}
              onChange={e => setRestorePath(e.target.value)}
              placeholder="e.g. C:\Users\Owner\Desktop\Backups\backup-2026-09-03.zip"
            />
            <p className="text-xs text-[#71717A] mt-1">Enter the full path to the backup ZIP file</p>
          </div>

          {!showRestoreWarning ? (
            <button
              className="btn btn-danger"
              onClick={() => setShowRestoreWarning(true)}
            >
              <Upload size={15} />
              Restore Backup
            </button>
          ) : (
            <div
              className="p-4 rounded-[8px]"
              style={{ background: '#22262E', border: '1px solid #2A2F38' }}
            >
              <p className="text-sm text-white mb-3">Are you absolutely sure? All current data will be replaced.</p>
              <div className="flex gap-3">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowRestoreWarning(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleRestore}
                  disabled={restoring}
                >
                  {restoring ? (
                    <><div className="spinner" style={{ width: 14, height: 14 }} />Restoring...</>
                  ) : (
                    'Yes, Restore Now'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-[#B8754F]" />
            <h3 className="text-sm font-semibold text-white">Backup Tips</h3>
          </div>
          <ul className="text-xs text-[#A1A1AA] space-y-2">
            <li>• Create a backup before making major changes</li>
            <li>• Store backups on an external drive or USB for safety</li>
            <li>• Name your backup folders by date for easy identification</li>
            <li>• Test your backups periodically by restoring to a test location</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
