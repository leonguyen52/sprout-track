import React, { useState, useCallback } from 'react';
import { cn } from '@/src/lib/utils';
import { styles } from './account-manager.styles';
import { AccountSettingsTabProps } from './account-manager.types';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { 
  User, 
  Mail, 
  Home, 
  Link, 
  Download, 
  AlertTriangle, 
  Edit, 
  Save, 
  X, 
  Loader2,
  CheckCircle
} from 'lucide-react';

/**
 * AccountSettingsTab Component
 * 
 * First tab of the account manager that handles account and family settings
 */
const AccountSettingsTab: React.FC<AccountSettingsTabProps> = ({
  accountStatus,
  familyData,
  onDataRefresh,
}) => {
  // Edit states
  const [editingAccount, setEditingAccount] = useState(false);
  const [editingFamily, setEditingFamily] = useState(false);
  
  // Form data states
  const [accountFormData, setAccountFormData] = useState({
    firstName: accountStatus.firstName,
    lastName: accountStatus.lastName || '',
    email: accountStatus.email,
  });
  
  const [familyFormData, setFamilyFormData] = useState({
    name: familyData.name,
    slug: familyData.slug,
  });
  
  // Loading and error states
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingFamily, setSavingFamily] = useState(false);
  const [downloadingData, setDownloadingData] = useState(false);
  const [closingAccount, setClosingAccount] = useState(false);
  
  // Validation states
  const [slugError, setSlugError] = useState('');
  const [checkingSlug, setCheckingSlug] = useState(false);
  
  // Success/error messages
  const [accountMessage, setAccountMessage] = useState('');
  const [familyMessage, setFamilyMessage] = useState('');

  // Check slug uniqueness
  const checkSlugUniqueness = useCallback(async (slug: string) => {
    if (!slug || slug.trim() === '' || slug === familyData.slug) {
      setSlugError('');
      return;
    }

    // Basic slug validation
    const slugPattern = /^[a-z0-9-]+$/;
    if (!slugPattern.test(slug)) {
      setSlugError('Slug can only contain lowercase letters, numbers, and hyphens');
      return;
    }

    if (slug.length < 3) {
      setSlugError('Slug must be at least 3 characters long');
      return;
    }

    if (slug.length > 50) {
      setSlugError('Slug must be less than 50 characters');
      return;
    }

    setCheckingSlug(true);
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`/api/family/by-slug/${encodeURIComponent(slug)}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      
      if (data.success && data.data && data.data.id !== familyData.id) {
        setSlugError('This slug is already taken');
      } else {
        setSlugError('');
      }
    } catch (error) {
      console.error('Error checking slug:', error);
      setSlugError('Error checking slug availability');
    } finally {
      setCheckingSlug(false);
    }
  }, [familyData.id, familyData.slug]);

  // Handle account form submission
  const handleAccountSave = async () => {
    setSavingAccount(true);
    setAccountMessage('');
    
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch('/api/accounts/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          firstName: accountFormData.firstName,
          lastName: accountFormData.lastName,
          email: accountFormData.email,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setEditingAccount(false);
        setAccountMessage('Account information updated successfully');
        onDataRefresh();
        
        // Clear message after 3 seconds
        setTimeout(() => setAccountMessage(''), 3000);
      } else {
        setAccountMessage(`Error: ${data.error || 'Failed to update account'}`);
      }
    } catch (error) {
      console.error('Error updating account:', error);
      setAccountMessage('Error: Failed to update account');
    } finally {
      setSavingAccount(false);
    }
  };

  // Handle family form submission
  const handleFamilySave = async () => {
    if (slugError) {
      setFamilyMessage('Please fix the slug error before saving');
      return;
    }

    setSavingFamily(true);
    setFamilyMessage('');
    
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch('/api/family', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: familyFormData.name,
          slug: familyFormData.slug,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setEditingFamily(false);
        setFamilyMessage('Family information updated successfully');
        onDataRefresh();
        
        // Clear message after 3 seconds
        setTimeout(() => setFamilyMessage(''), 3000);
      } else {
        setFamilyMessage(`Error: ${data.error || 'Failed to update family'}`);
      }
    } catch (error) {
      console.error('Error updating family:', error);
      setFamilyMessage('Error: Failed to update family');
    } finally {
      setSavingFamily(false);
    }
  };

  // Handle data download
  const handleDataDownload = async () => {
    setDownloadingData(true);
    
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch('/api/accounts/download-data', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${familyData.slug}-data-export.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || 'Failed to download data'}`);
      }
    } catch (error) {
      console.error('Error downloading data:', error);
      alert('Error: Failed to download data');
    } finally {
      setDownloadingData(false);
    }
  };

  // Handle account closure
  const handleAccountClosure = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to close your account? This action cannot be undone and will disable access to your family data.'
    );
    
    if (!confirmed) return;
    
    setClosingAccount(true);
    
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch('/api/accounts/close', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Your account has been closed successfully. You will now be logged out.');
        
        // Clear authentication and redirect
        localStorage.removeItem('authToken');
        localStorage.removeItem('accountUser');
        localStorage.removeItem('unlockTime');
        localStorage.removeItem('caretakerId');
        
        window.location.href = '/';
      } else {
        alert(`Error: ${data.error || 'Failed to close account'}`);
      }
    } catch (error) {
      console.error('Error closing account:', error);
      alert('Error: Failed to close account');
    } finally {
      setClosingAccount(false);
    }
  };

  // Handle slug input change with debounced validation
  React.useEffect(() => {
    if (familyFormData.slug && familyFormData.slug !== familyData.slug) {
      const timeoutId = setTimeout(() => {
        checkSlugUniqueness(familyFormData.slug);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [familyFormData.slug, familyData.slug, checkSlugUniqueness]);

  return (
    <div className="space-y-6">
      {/* Account Information Section */}
      <div className={cn(styles.sectionBorder, "account-manager-section-border")}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn(styles.sectionTitle, "account-manager-section-title")}>
            Account Information
          </h3>
          {!editingAccount && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingAccount(true);
                setAccountMessage('');
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        {editingAccount ? (
          <div className={cn(styles.formGroup, "account-manager-form-group")}>
            <div className={styles.formRow}>
              <div className={cn(styles.formField, "account-manager-form-field")}>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={accountFormData.firstName}
                  onChange={(e) => setAccountFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  disabled={savingAccount}
                />
              </div>
              <div className={cn(styles.formField, "account-manager-form-field")}>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={accountFormData.lastName}
                  onChange={(e) => setAccountFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  disabled={savingAccount}
                />
              </div>
            </div>
            <div className={cn(styles.formField, "account-manager-form-field")}>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={accountFormData.email}
                onChange={(e) => setAccountFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled={savingAccount}
              />
            </div>
            
            <div className={styles.buttonGroup}>
              <Button
                onClick={handleAccountSave}
                disabled={savingAccount}
              >
                {savingAccount ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingAccount(false);
                  setAccountFormData({
                    firstName: accountStatus.firstName,
                    lastName: accountStatus.lastName || '',
                    email: accountStatus.email,
                  });
                  setAccountMessage('');
                }}
                disabled={savingAccount}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.formGroup}>
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{accountStatus.firstName} {accountStatus.lastName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span>{accountStatus.email}</span>
              {!accountStatus.verified && (
                <span className="text-amber-600 text-sm">(Unverified)</span>
              )}
            </div>
          </div>
        )}

        {accountMessage && (
          <div className={cn(
            "mt-4 p-3 rounded-md text-sm",
            accountMessage.startsWith('Error') 
              ? "bg-red-50 text-red-600 account-manager-error-message" 
              : "bg-green-50 text-green-600 account-manager-success-message"
          )}>
            <div className="flex items-center gap-2">
              {accountMessage.startsWith('Error') ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {accountMessage}
            </div>
          </div>
        )}
      </div>

      {/* Family Information Section */}
      <div className={cn(styles.sectionBorder, "account-manager-section-border")}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn(styles.sectionTitle, "account-manager-section-title")}>
            Family Information
          </h3>
          {!editingFamily && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingFamily(true);
                setFamilyMessage('');
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        {editingFamily ? (
          <div className={cn(styles.formGroup, "account-manager-form-group")}>
            <div className={cn(styles.formField, "account-manager-form-field")}>
              <Label htmlFor="familyName">Family Name</Label>
              <Input
                id="familyName"
                value={familyFormData.name}
                onChange={(e) => setFamilyFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={savingFamily}
              />
            </div>
            <div className={cn(styles.formField, "account-manager-form-field")}>
              <Label htmlFor="familySlug">Family URL Slug</Label>
              <div className="relative">
                <Input
                  id="familySlug"
                  value={familyFormData.slug}
                  onChange={(e) => setFamilyFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                  disabled={savingFamily}
                  className={slugError ? 'border-red-500' : ''}
                />
                {checkingSlug && (
                  <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                )}
              </div>
              {slugError && (
                <div className="flex items-center gap-1 text-red-600 text-sm mt-1 account-manager-validation-error">
                  <AlertTriangle className="h-3 w-3" />
                  {slugError}
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1 account-manager-info-text">
                This is your family's unique URL identifier
              </p>
            </div>
            
            <div className={styles.buttonGroup}>
              <Button
                onClick={handleFamilySave}
                disabled={savingFamily || !!slugError || checkingSlug}
              >
                {savingFamily ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingFamily(false);
                  setFamilyFormData({
                    name: familyData.name,
                    slug: familyData.slug,
                  });
                  setSlugError('');
                  setFamilyMessage('');
                }}
                disabled={savingFamily}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.formGroup}>
            <div className="flex items-center gap-2 mb-2">
              <Home className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{familyData.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Link className="h-4 w-4 text-gray-500" />
              <span className="font-mono">/{familyData.slug}</span>
            </div>
          </div>
        )}

        {familyMessage && (
          <div className={cn(
            "mt-4 p-3 rounded-md text-sm",
            familyMessage.startsWith('Error') 
              ? "bg-red-50 text-red-600 account-manager-error-message" 
              : "bg-green-50 text-green-600 account-manager-success-message"
          )}>
            <div className="flex items-center gap-2">
              {familyMessage.startsWith('Error') ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {familyMessage}
            </div>
          </div>
        )}
      </div>

      {/* Data Download Section */}
      <div className={cn(styles.downloadSection, "account-manager-download-section")}>
        <h3 className={cn(styles.sectionTitle, "account-manager-section-title")}>
          Download Your Data
        </h3>
        <p className="text-sm text-gray-600 mb-4 account-manager-info-text">
          Download a complete copy of your family's data including all activities, contacts, and settings.
        </p>
        <Button
          onClick={handleDataDownload}
          disabled={downloadingData}
          className={styles.downloadButton}
        >
          {downloadingData ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Preparing Download...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download Data
            </>
          )}
        </Button>
      </div>

      {/* Account Closure Section */}
      <div className={cn(styles.closureSection, "account-manager-closure-section")}>
        <h3 className={cn(styles.sectionTitle, "account-manager-section-title text-red-700")}>
          Close Account
        </h3>
        <p className={cn(styles.closureWarning, "account-manager-closure-warning")}>
          <AlertTriangle className="h-4 w-4 inline mr-1" />
          Warning: Closing your account will permanently disable access to your family data. 
          This action cannot be undone. Please download your data first if you want to keep it.
        </p>
        <Button
          onClick={handleAccountClosure}
          disabled={closingAccount}
          className={styles.closureButton}
        >
          {closingAccount ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Closing Account...
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Close Account
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AccountSettingsTab;
