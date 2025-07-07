'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { Settings, Download, Upload, X, Save } from 'lucide-react';
import { useTheme } from '@/src/context/theme';
import { cn } from '@/src/lib/utils';

// Import component-specific files
import './backup-restore.css';
import { backupRestoreStyles } from './backup-restore.styles';
import { BackupRestoreProps, BackupRestoreState } from './backup-restore.types';

export const BackupRestore: React.FC<BackupRestoreProps> = ({
  isLoading = false,
  isSaving = false,
  onBackupSuccess,
  onBackupError,
  onRestoreSuccess,
  onRestoreError,
  className
}) => {
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [state, setState] = useState<BackupRestoreState>({
    isRestoring: false,
    error: null,
    success: null
  });

  // Clear messages helper
  const clearMessages = () => {
    setState(prev => ({ ...prev, error: null, success: null }));
  };

  // Handle backup
  const handleBackup = async () => {
    try {
      clearMessages();
      
      const authToken = localStorage.getItem('authToken');
      const headers: HeadersInit = authToken ? {
        'Authorization': `Bearer ${authToken}`
      } : {};

      const response = await fetch('/api/database', { headers });
      if (!response.ok) throw new Error('Backup failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1].replace(/"/g, '') || 'baby-tracker-backup.db';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setState(prev => ({ ...prev, success: 'Backup created successfully' }));
      onBackupSuccess?.();
    } catch (error) {
      console.error('Backup error:', error);
      const errorMessage = 'Failed to create backup';
      setState(prev => ({ ...prev, error: errorMessage }));
      onBackupError?.(errorMessage);
    }
  };

  // Handle restore
  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setState(prev => ({ ...prev, isRestoring: true, error: null, success: null }));
      
      const formData = new FormData();
      formData.append('file', file);

      const authToken = localStorage.getItem('authToken');
      const headers: HeadersInit = authToken ? {
        'Authorization': `Bearer ${authToken}`
      } : {};

      const response = await fetch('/api/database', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Restore failed');
      }

      setState(prev => ({ 
        ...prev, 
        success: 'Database restored successfully. The page will reload to reflect changes.' 
      }));
      
      onRestoreSuccess?.();
      
      // Refresh the page after a short delay to show the success message
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Restore error:', error);
      const errorMessage = 'Failed to restore backup';
      setState(prev => ({ ...prev, error: errorMessage }));
      onRestoreError?.(errorMessage);
    } finally {
      setState(prev => ({ ...prev, isRestoring: false }));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={cn(backupRestoreStyles.container, className)}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".db"
        onChange={handleRestore}
        style={{ display: 'none' }}
      />
      
      {/* Section Header */}
      <div className={backupRestoreStyles.header.container}>
        <Settings className={backupRestoreStyles.header.icon} />
        <Label className={backupRestoreStyles.header.title}>
          Database Management
        </Label>
      </div>

      {/* Action Buttons */}
      <div className={backupRestoreStyles.buttonContainer}>
        <Button
          type="button"
          variant="outline"
          onClick={handleBackup}
          className={backupRestoreStyles.button.backup}
          disabled={isLoading || isSaving || state.isRestoring}
        >
          <Download className={backupRestoreStyles.icon} />
          Backup Database
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className={backupRestoreStyles.button.restore}
          disabled={isLoading || isSaving || state.isRestoring}
        >
          <Upload className={backupRestoreStyles.icon} />
          {state.isRestoring ? 'Restoring...' : 'Restore Database'}
        </Button>
      </div>
      
      {/* Help Text */}
      <p className={backupRestoreStyles.helpText}>
        Create backups of your database or restore from a previous backup. 
        Restoring will replace all current data.
      </p>

      {/* Error Message */}
      {state.error && (
        <div className={backupRestoreStyles.error.container}>
          <div className={backupRestoreStyles.error.content}>
            <X className={backupRestoreStyles.error.icon} />
            <span className={backupRestoreStyles.error.text}>{state.error}</span>
          </div>
        </div>
      )}

      {/* Success Message */}
      {state.success && (
        <div className={backupRestoreStyles.success.container}>
          <div className={backupRestoreStyles.success.content}>
            <Save className={backupRestoreStyles.success.icon} />
            <span className={backupRestoreStyles.success.text}>{state.success}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupRestore; 