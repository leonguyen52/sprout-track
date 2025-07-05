'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Checkbox } from '@/src/components/ui/checkbox';
import { 
  FormPage, 
  FormPageContent, 
  FormPageFooter 
} from '@/src/components/ui/form-page';
import { Settings, Loader2, Save, X, Download, Upload } from 'lucide-react';

interface AppConfigFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AppConfigData {
  id: string;
  adminPass: string;
  rootDomain: string;
  enableHttps: boolean;
  updatedAt: string;
}

export default function AppConfigForm({ 
  isOpen, 
  onClose 
}: AppConfigFormProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [appConfig, setAppConfig] = useState<AppConfigData | null>(null);
  const [formData, setFormData] = useState({
    adminPass: '',
    rootDomain: '',
    enableHttps: false,
  });
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordStep, setPasswordStep] = useState<'verify' | 'new' | 'confirm'>('verify');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [originalPassword, setOriginalPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Fetch app config data
  const fetchAppConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/app-config');
      const data = await response.json();
      
      if (data.success) {
        setAppConfig(data.data);
        setOriginalPassword(data.data.adminPass || '');
        setFormData({
          adminPass: data.data.adminPass || '',
          rootDomain: data.data.rootDomain || '',
          enableHttps: data.data.enableHttps || false,
        });
        setShowPasswordChange(false);
        setPasswordStep('verify');
        setVerifyPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || 'Failed to fetch app configuration');
      }
    } catch (error) {
      console.error('Error fetching app config:', error);
      setError('Failed to fetch app configuration');
    } finally {
      setLoading(false);
    }
  };

  // Load data when form opens
  useEffect(() => {
    if (isOpen) {
      fetchAppConfig();
    }
  }, [isOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  // Handle checkbox changes
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
    setError(null);
    setSuccess(null);
  };

  // Handle password step changes
  const handleVerifyPassword = () => {
    if (verifyPassword === originalPassword) {
      setPasswordStep('new');
      setError(null);
    } else {
      setError('Incorrect current password');
      setVerifyPassword('');
    }
  };

  const handleNewPassword = () => {
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setPasswordStep('confirm');
    setError(null);
  };

  const handleConfirmPassword = async () => {
    if (newPassword === confirmPassword) {
      try {
        setSaving(true);
        setError(null);

        // Update password in database immediately
        const response = await fetch('/api/app-config', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            adminPass: newPassword
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Update local state with new password data
          setAppConfig(data.data);
          setFormData(prev => ({ ...prev, adminPass: data.data.adminPass }));
          setOriginalPassword(data.data.adminPass);
          
          // Reset password form for potential next change
          setShowPasswordChange(false);
          setPasswordStep('verify');
          setVerifyPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setError(null);
          setSuccess('Password changed successfully');
          scheduleAutoClose();
        } else {
          setError(data.error || 'Failed to update password');
        }
      } catch (error) {
        console.error('Error updating password:', error);
        setError('Failed to update password');
      } finally {
        setSaving(false);
      }
    } else {
      setError('Passwords do not match');
      setConfirmPassword('');
    }
  };

  const resetPasswordForm = () => {
    setShowPasswordChange(false);
    setPasswordStep('verify');
    setVerifyPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.adminPass.trim()) {
      setError('Admin password is required');
      return false;
    }

    if (!formData.rootDomain.trim()) {
      setError('Root domain is required');
      return false;
    }

    // Flexible domain/IP validation - allows domain, IP, localhost, with optional port
    const domainOrIpRegex = /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?|(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|localhost)(?::[1-9][0-9]{0,4})?$/;
    if (!domainOrIpRegex.test(formData.rootDomain)) {
      setError('Please enter a valid domain, IP address, or localhost (with optional port)');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/app-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setAppConfig(data.data);
        setSuccess('App configuration updated successfully');
        scheduleAutoClose();
      } else {
        setError(data.error || 'Failed to update app configuration');
      }
    } catch (error) {
      console.error('Error updating app config:', error);
      setError('Failed to update app configuration');
    } finally {
      setSaving(false);
    }
  };

  // Handle backup
  const handleBackup = async () => {
    try {
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
    } catch (error) {
      console.error('Backup error:', error);
      setError('Failed to create backup');
    }
  };

  // Handle restore
  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsRestoring(true);
      setError(null);
      setSuccess(null);
      
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

      setSuccess('Database restored successfully. The page will reload to reflect changes.');
      
      // Refresh the page after a short delay to show the success message
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Restore error:', error);
      setError('Failed to restore backup');
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Auto-close form after successful save
  const scheduleAutoClose = () => {
    // Clear any existing timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    
    // Schedule auto-close after 500ms
    closeTimeoutRef.current = setTimeout(() => {
      handleClose();
    }, 500);
  };

  // Handle form close
  const handleClose = () => {
    // Clear any pending auto-close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    
    setError(null);
    setSuccess(null);
    resetPasswordForm();
    onClose();
  };

  return (
    <FormPage 
      isOpen={isOpen} 
      onClose={handleClose}
      title="App Configuration"
      description="Manage global application settings"
    >
      <input
        type="file"
        ref={fileInputRef}
        accept=".db"
        onChange={handleRestore}
        style={{ display: 'none' }}
      />
      <form onSubmit={handleSubmit} className="h-full flex flex-col overflow-hidden">
        <FormPageContent className="space-y-6 overflow-y-auto flex-1 pb-24">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <span className="ml-2 text-gray-600">Loading configuration...</span>
            </div>
          ) : (
            <>
              {/* System Settings Section */}
              <div className="space-y-4">
                                 <div className="flex items-center space-x-2">
                   <Settings className="h-5 w-5 text-teal-600" />
                   <Label className="text-lg font-semibold">
                     System Settings
                   </Label>
                 </div>

                <div className="space-y-4">
                  {/* Password Change Section */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Admin Password
                    </Label>
                    
                    {!showPasswordChange ? (
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          disabled
                          value="••••••"
                          className="flex-1 font-mono"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowPasswordChange(true)}
                          disabled={loading}
                        >
                          Change Password
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm font-medium">
                            Change Admin Password
                          </Label>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={resetPasswordForm}
                          >
                            Cancel
                          </Button>
                        </div>

                        {passwordStep === 'verify' && (
                          <div className="space-y-2">
                            <Label htmlFor="verifyPassword" className="text-sm">
                              Current Password
                            </Label>
                            <div className="flex space-x-2">
                              <Input
                                type="password"
                                id="verifyPassword"
                                value={verifyPassword}
                                onChange={(e) => {
                                  setVerifyPassword(e.target.value);
                                  setError(null);
                                  setSuccess(null);
                                }}
                                placeholder="Enter current password"
                                autoComplete="current-password"
                              />
                              <Button 
                                type="button" 
                                onClick={handleVerifyPassword}
                                disabled={!verifyPassword.trim()}
                              >
                                Continue
                              </Button>
                            </div>
                          </div>
                        )}

                        {passwordStep === 'new' && (
                          <div className="space-y-2">
                            <Label htmlFor="newPassword" className="text-sm">
                              New Password
                            </Label>
                            <div className="flex space-x-2">
                              <Input
                                type="password"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => {
                                  setNewPassword(e.target.value);
                                  setError(null);
                                  setSuccess(null);
                                }}
                                placeholder="Enter new password"
                                autoComplete="new-password"
                              />
                              <Button 
                                type="button" 
                                onClick={handleNewPassword}
                                disabled={!newPassword.trim()}
                              >
                                Continue
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                              Password must be at least 6 characters
                            </p>
                          </div>
                        )}

                        {passwordStep === 'confirm' && (
                          <div className="space-y-2">
                            <Label htmlFor="confirmNewPassword" className="text-sm">
                              Confirm New Password
                            </Label>
                            <div className="flex space-x-2">
                              <Input
                                type="password"
                                id="confirmNewPassword"
                                value={confirmPassword}
                                onChange={(e) => {
                                  setConfirmPassword(e.target.value);
                                  setError(null);
                                  setSuccess(null);
                                }}
                                placeholder="Confirm new password"
                                autoComplete="new-password"
                              />
                              <Button 
                                type="button" 
                                onClick={handleConfirmPassword}
                                disabled={!confirmPassword.trim() || saving}
                              >
                                {saving ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Updating...
                                  </>
                                ) : (
                                  'Update'
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      This password is used for system-wide administrative access
                    </p>
                  </div>

                  {/* Root Domain */}
                  <div className="space-y-2">
                    <Label htmlFor="rootDomain" className="text-sm font-medium">
                      Root Domain
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="rootDomain"
                      name="rootDomain"
                      value={formData.rootDomain}
                      onChange={handleInputChange}
                      placeholder="example.com"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      The primary domain for this application instance
                    </p>
                  </div>

                  {/* HTTPS Setting */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="enableHttps"
                        checked={formData.enableHttps}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('enableHttps', checked as boolean)
                        }
                      />
                      <Label htmlFor="enableHttps" className="text-sm font-medium cursor-pointer">
                        Enable HTTPS
                      </Label>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">
                      Enable secure HTTPS connections for the application
                    </p>
                  </div>
                </div>
              </div>

              {/* Database Management Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-teal-600" />
                  <Label className="text-lg font-semibold">
                    Database Management
                  </Label>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBackup}
                      className="w-full"
                      disabled={loading || saving}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Backup Database
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                      disabled={loading || saving || isRestoring}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isRestoring ? 'Restoring...' : 'Restore Database'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Create backups of your database or restore from a previous backup. 
                    Restoring will replace all current data.
                  </p>
                </div>
              </div>

              {/* Status Messages */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <div className="flex items-center">
                    <X className="h-4 w-4 text-red-500 mr-2" />
                    <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                  </div>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <div className="flex items-center">
                    <Save className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm text-green-700 dark:text-green-300">{success}</span>
                  </div>
                </div>
              )}

              {/* Last Updated Info */}
              {appConfig && (
                <div className="text-xs text-gray-500 pt-4 border-t border-gray-200 dark:border-gray-700">
                  Last updated: {new Date(appConfig.updatedAt).toLocaleString()}
                </div>
              )}
            </>
          )}
        </FormPageContent>
        
        <FormPageFooter>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700"
              disabled={saving || loading}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </FormPageFooter>
      </form>
    </FormPage>
  );
} 