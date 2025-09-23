'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Baby, Unit, Caretaker } from '@prisma/client';
import { Settings } from '@/app/api/types';
import { Settings as Plus, Edit, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { Contact } from '@/src/components/CalendarEvent/calendar-event.types';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { 
  FormPage, 
  FormPageContent, 
  FormPageFooter 
} from '@/src/components/ui/form-page';
import { ShareButton } from '@/src/components/ui/share-button';
import BabyForm from '@/src/components/forms/BabyForm';
import CaretakerForm from '@/src/components/forms/CaretakerForm';
import ContactForm from '@/src/components/forms/ContactForm';
import ChangePinModal from '@/src/components/modals/ChangePinModal';

interface FamilyData {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SettingsFormProps {
  isOpen: boolean;
  onClose: () => void;
  onBabySelect?: (babyId: string) => void;
  onBabyStatusChange?: () => void;
  selectedBabyId?: string;
  familyId?: string;
}

export default function SettingsForm({ 
  isOpen, 
  onClose,
  onBabySelect,
  onBabyStatusChange,
  selectedBabyId,
  familyId,
}: SettingsFormProps) {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [family, setFamily] = useState<FamilyData | null>(null);
  const [babies, setBabies] = useState<Baby[]>([]);
  const [caretakers, setCaretakers] = useState<Caretaker[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBabyForm, setShowBabyForm] = useState(false);
  const [showCaretakerForm, setShowCaretakerForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBaby, setSelectedBaby] = useState<Baby | null>(null);
  const [selectedCaretaker, setSelectedCaretaker] = useState<Caretaker | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [localSelectedBabyId, setLocalSelectedBabyId] = useState<string>('');
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [appConfig, setAppConfig] = useState<{ rootDomain: string; enableHttps: boolean } | null>(null);
  const [deploymentConfig, setDeploymentConfig] = useState<{ deploymentMode: string; enableAccounts: boolean; allowAccountRegistration: boolean } | null>(null);

  // Family editing state
  const [editingFamily, setEditingFamily] = useState(false);
  const [familyEditData, setFamilyEditData] = useState<Partial<FamilyData>>({});
  const [slugError, setSlugError] = useState<string>('');
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [savingFamily, setSavingFamily] = useState(false);

  // Local warning time form state for selected baby
  const [warningTimesForm, setWarningTimesForm] = useState<{ feedWarningTime: string; diaperWarningTime: string }>({ feedWarningTime: '', diaperWarningTime: '' });
  const [savingWarningTimes, setSavingWarningTimes] = useState(false);

  // Local notification settings form state
  const [notificationForm, setNotificationForm] = useState({
    notificationEnabled: false,
    hermesApiKey: '',
    notificationTitle: '‼️ Warning',
    notificationFeedSubtitle: 'It\'s time for feeding ♥️',
    notificationFeedBody: 'Baby might be hungry soon, please be ready and prepare in advance~',
    notificationDiaperSubtitle: 'It\'s time for diary ♥️',
    notificationDiaperBody: 'Mom and Dad, please check diary in time for our baby~',
    notificationFeedAdvanceMinutes: 0,
    notificationDiaperAdvanceMinutes: 0,
  });
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Monitoring state
  const [monitoringStatus, setMonitoringStatus] = useState<{ active: boolean; interval: number } | null>(null);
  const [monitoringLoading, setMonitoringLoading] = useState(false);

  useEffect(() => {
    // Only set the selected baby ID if explicitly provided
    setLocalSelectedBabyId(selectedBabyId || '');
  }, [selectedBabyId]);

  // Check slug uniqueness
  const checkSlugUniqueness = useCallback(async (slug: string, currentFamilyId: string) => {
    if (!slug || slug.trim() === '') {
      setSlugError('');
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
      
      if (data.success && data.data && data.data.id !== currentFamilyId) {
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
  }, []);

  // Debounced slug check
  useEffect(() => {
    if (familyEditData.slug && family?.id) {
      const timeoutId = setTimeout(() => {
        checkSlugUniqueness(familyEditData.slug!, family.id);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [familyEditData.slug, family?.id, checkSlugUniqueness]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get auth token for all requests
      const authToken = localStorage.getItem('authToken');
      const headers: HeadersInit = authToken ? {
        'Authorization': `Bearer ${authToken}`
      } : {};
      
      // Check if user is system administrator and build query params
      let isSysAdmin = false;
      if (authToken) {
        try {
          const payload = authToken.split('.')[1];
          const decodedPayload = JSON.parse(atob(payload));
          isSysAdmin = decodedPayload.isSysAdmin || false;
        } catch (error) {
          console.error('Error parsing JWT token in SettingsForm:', error);
        }
      }
      
      // Build URLs with familyId parameter for system administrators
      const settingsUrl = isSysAdmin && familyId ? `/api/settings?familyId=${familyId}` : '/api/settings';
      const babiesUrl = isSysAdmin && familyId ? `/api/baby?familyId=${familyId}` : '/api/baby';
      const caretakersUrl = isSysAdmin && familyId ? `/api/caretaker?includeInactive=true&familyId=${familyId}` : '/api/caretaker?includeInactive=true';
      const contactsUrl = isSysAdmin && familyId ? `/api/contact?familyId=${familyId}` : '/api/contact';
      const familyUrl = '/api/family';
      
      const [settingsResponse, familyResponse, babiesResponse, unitsResponse, caretakersResponse, contactsResponse, appConfigResponse, deploymentConfigResponse] = await Promise.all([
        fetch(settingsUrl, { headers }),
        fetch(familyUrl, { headers }),
        fetch(babiesUrl, { headers }),
        fetch('/api/units', { headers }),
        fetch(caretakersUrl, { headers }),
        fetch(contactsUrl, { headers }),
        fetch('/api/app-config/public', { headers }),
        fetch('/api/deployment-config', { headers })
      ]);

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings(settingsData.data);
      }

      if (familyResponse.ok) {
        const familyData = await familyResponse.json();
        setFamily(familyData.data);
        // Initialize family edit data
        setFamilyEditData({
          name: familyData.data.name,
          slug: familyData.data.slug,
        });
      }

      if (babiesResponse.ok) {
        const babiesData = await babiesResponse.json();
        setBabies(babiesData.data);
      }

      if (unitsResponse.ok) {
        const unitsData = await unitsResponse.json();
        setUnits(unitsData.data);
      }

      if (caretakersResponse.ok) {
        const caretakersData = await caretakersResponse.json();
        setCaretakers(caretakersData.data);
      }

      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json();
        setContacts(contactsData.data);
      }

      if (appConfigResponse.ok) {
        const appConfigData = await appConfigResponse.json();
        setAppConfig(appConfigData.data);
      }

      if (deploymentConfigResponse.ok) {
        const deploymentConfigData = await deploymentConfigResponse.json();
        setDeploymentConfig(deploymentConfigData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when form opens
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const handleSettingsChange = async (updates: Partial<Settings>) => {
    try {
      const authToken = localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      };

      // Check if user is system administrator and build URL with familyId parameter
      let isSysAdmin = false;
      if (authToken) {
        try {
          const payload = authToken.split('.')[1];
          const decodedPayload = JSON.parse(atob(payload));
          isSysAdmin = decodedPayload.isSysAdmin || false;
        } catch (error) {
          console.error('Error parsing JWT token in handleSettingsChange:', error);
        }
      }

      const settingsUrl = isSysAdmin && familyId ? `/api/settings?familyId=${familyId}` : '/api/settings';

      console.log('Sending settings update to:', settingsUrl);
      console.log('Updates:', updates);

      const response = await fetch(settingsUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Settings update response:', data);
        setSettings(data.data);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Settings update failed:', response.status, errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error; // Re-throw so the calling function can handle it
    }
  };

  const handleFamilyEdit = () => {
    setEditingFamily(true);
    setFamilyEditData({
      name: family?.name || '',
      slug: family?.slug || '',
    });
    setSlugError('');
  };

  const handleFamilyCancelEdit = () => {
    setEditingFamily(false);
    setFamilyEditData({
      name: family?.name || '',
      slug: family?.slug || '',
    });
    setSlugError('');
  };

  const handleFamilySave = async () => {
    // Don't save if there's a slug error
    if (slugError) {
      alert('Please fix the slug error before saving');
      return;
    }

    if (!familyEditData.name || !familyEditData.slug) {
      alert('Family name and slug are required');
      return;
    }

    try {
      setSavingFamily(true);
      const authToken = localStorage.getItem('authToken');
      const response = await fetch('/api/family', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: familyEditData.name,
          slug: familyEditData.slug,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setFamily(data.data);
        setEditingFamily(false);
        setSlugError('');
        
        // If slug changed, we should refresh or redirect
        if (data.data.slug !== family?.slug) {
          // Optionally refresh the page or show a message about the URL change
          console.log('Family slug updated successfully');
        }
      } else {
        console.error('Failed to save family:', data.error);
        alert('Failed to save changes: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving family:', error);
      alert('Error saving changes');
    } finally {
      setSavingFamily(false);
    }
  };

  const handleOpenFamilyManager = () => {
    router.push('/family-manager');
  };

  // Sync warning time form with currently selected baby
  useEffect(() => {
    const selected = babies.find(b => b.id === (localSelectedBabyId || selectedBabyId));
    if (selected) {
      setWarningTimesForm({
        feedWarningTime: (selected as any).feedWarningTime || '02:00',
        diaperWarningTime: (selected as any).diaperWarningTime || '03:00',
      });
    } else {
      setWarningTimesForm({ feedWarningTime: '', diaperWarningTime: '' });
    }
  }, [babies, localSelectedBabyId, selectedBabyId]);

  // Sync notification form with settings when they load
  useEffect(() => {
    if (settings) {
      setNotificationForm({
        notificationEnabled: (settings as any)?.notificationEnabled || false,
        hermesApiKey: (settings as any)?.hermesApiKey || '',
        notificationTitle: (settings as any)?.notificationTitle || '‼️ Baby Tracker Warning',
        notificationFeedSubtitle: (settings as any)?.notificationFeedSubtitle || 'Attention! It\'s time for feeding ♥️',
        notificationFeedBody: (settings as any)?.notificationFeedBody || 'Baby might be hungry soon, please be ready and prepare in advance~',
        notificationDiaperSubtitle: (settings as any)?.notificationDiaperSubtitle || 'Attention! It\'s time for diary ♥️',
        notificationDiaperBody: (settings as any)?.notificationDiaperBody || 'Mom and Dad, please check diary in time for our baby~',
        notificationFeedAdvanceMinutes: (settings as any)?.notificationFeedAdvanceMinutes ?? 0,
        notificationDiaperAdvanceMinutes: (settings as any)?.notificationDiaperAdvanceMinutes ?? 0,
      });
    }
  }, [settings]);

  const handleSaveWarningTimes = async () => {
    const targetBabyId = localSelectedBabyId || selectedBabyId;
    if (!targetBabyId) return;
    try {
      setSavingWarningTimes(true);
      const authToken = localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      };

      const response = await fetch('/api/baby', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          id: targetBabyId,
          feedWarningTime: warningTimesForm.feedWarningTime,
          diaperWarningTime: warningTimesForm.diaperWarningTime,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save warning times');
      }

      const updated = await response.json();
      if (updated?.data) {
        setBabies(prev => prev.map(b => (b.id === targetBabyId ? { ...b, ...updated.data } as any : b)));
      } else {
        // Fallback: refresh data
        await fetchData();
      }
    } catch (error) {
      console.error('Error saving warning times:', error);
      alert('Could not save warning times. Please try again.');
    } finally {
      setSavingWarningTimes(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    try {
      setSavingNotifications(true);
      console.log('Saving notification settings:', notificationForm);
      await handleSettingsChange(notificationForm as any);
      console.log('Notification settings saved successfully');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      alert('Could not save notification settings. Please try again.');
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleTestNotification = async (type: 'FEED' | 'DIAPER') => {
    try {
      setTestingNotification(true);
      setTestResult(null);

      const authToken = localStorage.getItem('authToken');
      const response = await fetch('/api/notify/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ 
          ...notificationForm,
          hermesApiEndpoint: 'https://hermes.funk-isoft.com/api/sendAlert', // Fixed endpoint
          type 
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setTestResult({ 
          success: true, 
          message: `Test ${type} notification sent successfully!` 
        });
      } else {
        setTestResult({ 
          success: false, 
          message: `Failed to send test notification: ${data.error || 'Unknown error'}` 
        });
      }
    } catch (error: any) {
      setTestResult({ 
        success: false, 
        message: `Error sending test notification: ${error.message}` 
      });
    } finally {
      setTestingNotification(false);
    }
  };

  // Monitoring functions
  const checkMonitoringStatus = async () => {
    try {
      const response = await fetch('/api/monitor/warnings?action=status');
      const data = await response.json();
      if (data.success) {
        setMonitoringStatus({ active: data.active, interval: data.interval });
      }
    } catch (error) {
      console.error('Error checking monitoring status:', error);
    }
  };

  const startMonitoring = async () => {
    try {
      setMonitoringLoading(true);
      const response = await fetch('/api/monitor/warnings?action=start');
      const data = await response.json();
      if (data.success) {
        setMonitoringStatus({ active: data.active, interval: 60 }); // 1 minute
        alert('Background monitoring started! Notifications will be sent every 1 minute.');
      } else {
        alert(`Failed to start monitoring: ${data.error}`);
      }
    } catch (error) {
      alert(`Error starting monitoring: ${error}`);
    } finally {
      setMonitoringLoading(false);
    }
  };

  const stopMonitoring = async () => {
    try {
      setMonitoringLoading(true);
      const response = await fetch('/api/monitor/warnings?action=stop');
      const data = await response.json();
      if (data.success) {
        setMonitoringStatus({ active: data.active, interval: 0 });
        alert('Background monitoring stopped.');
      } else {
        alert(`Failed to stop monitoring: ${data.error}`);
      }
    } catch (error) {
      alert(`Error stopping monitoring: ${error}`);
    } finally {
      setMonitoringLoading(false);
    }
  };

  const runManualCheck = async () => {
    try {
      setMonitoringLoading(true);
      const response = await fetch('/api/monitor/warnings?action=check');
      const data = await response.json();
      if (data.success) {
        alert('Manual warning check completed! Check the server logs for details.');
      } else {
        alert(`Manual check failed: ${data.error}`);
      }
    } catch (error) {
      alert(`Error running manual check: ${error}`);
    } finally {
      setMonitoringLoading(false);
    }
  };

  // Check monitoring status on component mount
  useEffect(() => {
    checkMonitoringStatus();
  }, []);

  const handleBabyFormClose = () => {
    setShowBabyForm(false);
  };

  const handleCaretakerFormClose = async () => {
    setShowCaretakerForm(false);
    await fetchData(); // Refresh local caretakers list
  };

  const handleContactFormClose = async () => {
    setShowContactForm(false);
    setSelectedContact(null); // Reset selected contact when form closes
    await fetchData(); // Refresh local contacts list
  };



  return (
    <>
      <FormPage
        isOpen={isOpen}
        onClose={() => {
          onBabyStatusChange?.(); // Refresh parent's babies list when settings form closes
          onClose();
        }}
        title="Settings"
        description="Configure your preferences for the Baby Tracker app"
      >
        <FormPageContent>
          <div className="space-y-6">
            {/* Family Information Section */}
            <div className="space-y-4">
              <h3 className="form-label mb-4">Family Information</h3>
              
              <div>
                <Label className="form-label">Family Name</Label>
                <div className="flex gap-2">
                  {editingFamily ? (
                    <>
                      <Input
                        value={familyEditData.name || ''}
                        onChange={(e) => setFamilyEditData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter family name"
                        className="flex-1"
                        disabled={savingFamily}
                      />
                      <Button
                        variant="outline"
                        onClick={handleFamilySave}
                        disabled={savingFamily || !!slugError || checkingSlug || !familyEditData.name || !familyEditData.slug}
                      >
                        {savingFamily ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Save'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleFamilyCancelEdit}
                        disabled={savingFamily}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Input
                        disabled
                        value={family?.name || ''}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={handleFamilyEdit}
                        disabled={loading}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <Label className="form-label">Link/Slug</Label>
                <div className="flex gap-2">
                  {editingFamily ? (
                    <div className="flex-1 space-y-1">
                      <div className="relative">
                        <Input
                          value={familyEditData.slug || ''}
                          onChange={(e) => setFamilyEditData(prev => ({ ...prev, slug: e.target.value }))}
                          placeholder="Enter family slug"
                          className={`w-full ${slugError ? 'border-red-500' : ''}`}
                          disabled={savingFamily}
                        />
                        {checkingSlug && (
                          <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                        )}
                      </div>
                      {slugError && (
                        <div className="flex items-center gap-1 text-red-600 text-xs">
                          <AlertCircle className="h-3 w-3" />
                          {slugError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <Input
                        disabled
                        value={family?.slug || ''}
                        className="flex-1 font-mono"
                      />
                      {family?.slug && (
                        <ShareButton
                          familySlug={family.slug}
                          familyName={family.name}
                          appConfig={appConfig || undefined}
                          variant="outline"
                          size="sm"
                          showText={false}
                        />
                      )}
                    </>
                  )}
                </div>
                {!editingFamily && (
                  <p className="text-sm text-gray-500 mt-1">This is your family's unique URL identifier</p>
                )}
              </div>
            </div>

            <div className="space-y-4">              
              <div>
                <Label className="form-label">Security PIN</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    disabled
                    value="••••••"
                    className="w-full font-mono"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setShowChangePinModal(true)}
                    disabled={loading || caretakers.length > 0}
                  >
                    Change PIN
                  </Button>
                </div>
                {caretakers.length > 0 ? (
                  <p className="text-sm text-red-500 mt-1">System PIN is disabled when caretakers exist. Use caretaker authentication instead.</p>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">PIN must be between 6 and 10 digits</p>
                )}
              </div>
            </div>
            


            <div className="border-t border-slate-200 pt-6">
              <h3 className="form-label mb-4">Manage Babies</h3>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 w-full">
                  <div className="flex-1 min-w-[200px]">
                    <Select 
                      value={localSelectedBabyId || ''} 
                      onValueChange={(babyId) => {
                        setLocalSelectedBabyId(babyId);
                        onBabySelect?.(babyId);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a baby" />
                      </SelectTrigger>
                      <SelectContent>
                        {babies.map((baby) => (
                          <SelectItem key={baby.id} value={baby.id}>
                            {baby.firstName} {baby.lastName}{baby.inactive ? ' (Inactive)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="outline"
                    disabled={!localSelectedBabyId}
                    onClick={() => {
                      const baby = babies.find(b => b.id === localSelectedBabyId);
                      setSelectedBaby(baby || null);
                      setIsEditing(true);
                      setShowBabyForm(true);
                    }}
                  >
                    <Edit className="h-4 w-3 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setIsEditing(false);
                    setSelectedBaby(null);
                    setShowBabyForm(true);
                  }}>
                    <Plus className="h-4 w-3 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h3 className="form-label mb-4">Manage Caretakers</h3>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 w-full">
                  <div className="flex-1 min-w-[200px]">
                    <Select 
                      value={selectedCaretaker?.id || ''} 
                      onValueChange={(caretakerId) => {
                        const caretaker = caretakers.find(c => c.id === caretakerId);
                        setSelectedCaretaker(caretaker || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a caretaker" />
                      </SelectTrigger>
                      <SelectContent>
                        {caretakers.map((caretaker) => (
                          <SelectItem key={caretaker.id} value={caretaker.id}>
                            {caretaker.name} {caretaker.type ? `(${caretaker.type})` : ''}{(caretaker as any).inactive ? ' (Inactive)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="outline"
                    disabled={!selectedCaretaker}
                    onClick={() => {
                      setIsEditing(true);
                      setShowCaretakerForm(true);
                    }}
                  >
                    <Edit className="h-4 w-3 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setIsEditing(false);
                    setSelectedCaretaker(null);
                    setShowCaretakerForm(true);
                  }}>
                    <Plus className="h-4 w-3 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h3 className="form-label mb-4">Manage Contacts</h3>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 w-full">
                  <div className="flex-1 min-w-[200px]">
                    <Select 
                      value={selectedContact?.id || ''} 
                      onValueChange={(contactId) => {
                        const contact = contacts.find(c => c.id === contactId);
                        setSelectedContact(contact || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a contact" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.name} {contact.role ? `(${contact.role})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="outline"
                    disabled={!selectedContact}
                    onClick={() => {
                      setIsEditing(true);
                      setShowContactForm(true);
                    }}
                  >
                    <Edit className="h-4 w-3 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setIsEditing(false);
                    setSelectedContact(null);
                    setShowContactForm(true);
                  }}>
                    <Plus className="h-4 w-3 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h3 className="form-label mb-4">Debug Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="form-label">Enable Debug Session Timer</Label>
                    <p className="text-sm text-gray-500">Shows JWT token expiration and user idle time</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enableDebugTimer"
                      checked={(settings as any)?.enableDebugTimer || false}
                      onChange={(e) => handleSettingsChange({ enableDebugTimer: e.target.checked } as any)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="form-label">Enable Debug Timezone Tool</Label>
                    <p className="text-sm text-gray-500">Shows timezone information and DST status</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enableDebugTimezone"
                      checked={(settings as any)?.enableDebugTimezone || false}
                      onChange={(e) => handleSettingsChange({ enableDebugTimezone: e.target.checked } as any)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="form-label">Enable Swipe to Change Date</Label>
                    <p className="text-sm text-gray-500">Enable swiping left/right in Log Entry to change the day</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enableSwipeDateChange"
                      checked={(settings as any)?.enableSwipeDateChange !== false}
                      onChange={(e) => handleSettingsChange({ enableSwipeDateChange: e.target.checked } as any)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h3 className="form-label mb-4">Default Units</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bottle Feeding Unit */}
                  <div>
                    <Label className="form-label">Bottle Feeding</Label>
                    <Select
                      value={settings?.defaultBottleUnit || 'OZ'}
                      onValueChange={(value) => handleSettingsChange({ defaultBottleUnit: value })}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units
                          .filter(unit => ['OZ', 'ML'].includes(unit.unitAbbr))
                          .map((unit) => (
                            <SelectItem key={unit.unitAbbr} value={unit.unitAbbr}>
                              {unit.unitName} ({unit.unitAbbr})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Solid Feeding Unit */}
                  <div>
                    <Label className="form-label">Solid Feeding</Label>
                    <Select
                      value={settings?.defaultSolidsUnit || 'TBSP'}
                      onValueChange={(value) => handleSettingsChange({ defaultSolidsUnit: value })}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units
                          .filter(unit => ['TBSP', 'G'].includes(unit.unitAbbr))
                          .map((unit) => (
                            <SelectItem key={unit.unitAbbr} value={unit.unitAbbr}>
                              {unit.unitName} ({unit.unitAbbr})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Height Unit */}
                  <div>
                    <Label className="form-label">Height</Label>
                    <Select
                      value={settings?.defaultHeightUnit || 'IN'}
                      onValueChange={(value) => handleSettingsChange({ defaultHeightUnit: value })}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units
                          .filter(unit => ['IN', 'CM'].includes(unit.unitAbbr))
                          .map((unit) => (
                            <SelectItem key={unit.unitAbbr} value={unit.unitAbbr}>
                              {unit.unitName} ({unit.unitAbbr})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Weight Unit */}
                  <div>
                    <Label className="form-label">Weight</Label>
                    <Select
                      value={settings?.defaultWeightUnit || 'LB'}
                      onValueChange={(value) => handleSettingsChange({ defaultWeightUnit: value })}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units
                          .filter(unit => ['LB', 'KG', 'G'].includes(unit.unitAbbr))
                          .map((unit) => (
                            <SelectItem key={unit.unitAbbr} value={unit.unitAbbr}>
                              {unit.unitName} ({unit.unitAbbr})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Temperature Unit */}
                  <div>
                    <Label className="form-label">Temperature</Label>
                    <Select
                      value={settings?.defaultTempUnit || 'F'}
                      onValueChange={(value) => handleSettingsChange({ defaultTempUnit: value })}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units
                          .filter(unit => ['F', 'C'].includes(unit.unitAbbr))
                          .map((unit) => (
                            <SelectItem key={unit.unitAbbr} value={unit.unitAbbr}>
                              {unit.unitName} ({unit.unitAbbr})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Times Section (per-baby) */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="form-label mb-4">Warning Times</h3>
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Configure when counters turn red for the selected baby. Format: hh:mm</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="form-label">Feed Warning Time</Label>
                    <Input
                      type="text"
                      pattern="[0-9]{2}:[0-9]{2}"
                      placeholder="02:00"
                      value={warningTimesForm.feedWarningTime}
                      onChange={(e) => setWarningTimesForm(v => ({ ...v, feedWarningTime: e.target.value }))}
                      disabled={loading || !(localSelectedBabyId || selectedBabyId)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label className="form-label">Diaper Warning Time</Label>
                    <Input
                      type="text"
                      pattern="[0-9]{2}:[0-9]{2}"
                      placeholder="03:00"
                      value={warningTimesForm.diaperWarningTime}
                      onChange={(e) => setWarningTimesForm(v => ({ ...v, diaperWarningTime: e.target.value }))}
                      disabled={loading || !(localSelectedBabyId || selectedBabyId)}
                      className="w-full"
                    />
                  </div>
                </div>
                {!(localSelectedBabyId || selectedBabyId) && (
                  <p className="text-xs text-gray-500">Select a baby above in Manage Babies to edit warning times.</p>
                )}
              </div>
            </div>

            {/* Notifications Settings (Hermes) */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="form-label mb-4">Notifications (Hermes)</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="form-label">Enable Notifications</Label>
                    <p className="text-sm text-gray-500">Send alerts when a timer crosses its warning threshold</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="notificationEnabled"
                      checked={notificationForm.notificationEnabled}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, notificationEnabled: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="form-label">Hermes API Key</Label>
                    <Input
                      type="password"
                      placeholder="Enter Hermes API key"
                      value={notificationForm.hermesApiKey}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, hermesApiKey: e.target.value }))}
                      disabled={loading}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="form-label">Notification Title</Label>
                    <Input
                      type="text"
                      placeholder="‼️ Baby Tracker Warning"
                      value={notificationForm.notificationTitle}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, notificationTitle: e.target.value }))}
                      disabled={loading}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="form-label">Feed Subtitle</Label>
                    <Input
                      type="text"
                      placeholder="Attention! It's time for feeding ♥️"
                      value={notificationForm.notificationFeedSubtitle}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, notificationFeedSubtitle: e.target.value }))}
                      disabled={loading}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label className="form-label">Feed Body</Label>
                    <Input
                      type="text"
                      placeholder="Baby might be hungry soon, please be ready and prepare in advance~"
                      value={notificationForm.notificationFeedBody}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, notificationFeedBody: e.target.value }))}
                      disabled={loading}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="form-label">Feed Advance</Label>
                    <Select
                      value={String(notificationForm.notificationFeedAdvanceMinutes)}
                      onValueChange={(v) => setNotificationForm(prev => ({ ...prev, notificationFeedAdvanceMinutes: parseInt(v, 10) }))}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Notify before" />
                      </SelectTrigger>
                      <SelectContent>
                        {[0,1,5,10,15,30].map((m) => (
                          <SelectItem key={`feed-adv-${m}`} value={String(m)}>{m === 0 ? 'At time' : `${m} min before`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="form-label">Diaper Advance</Label>
                    <Select
                      value={String(notificationForm.notificationDiaperAdvanceMinutes)}
                      onValueChange={(v) => setNotificationForm(prev => ({ ...prev, notificationDiaperAdvanceMinutes: parseInt(v, 10) }))}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Notify before" />
                      </SelectTrigger>
                      <SelectContent>
                        {[0,1,5,10,15,30].map((m) => (
                          <SelectItem key={`diaper-adv-${m}`} value={String(m)}>{m === 0 ? 'At time' : `${m} min before`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="form-label">Diaper Subtitle</Label>
                    <Input
                      type="text"
                      placeholder="Attention! It's time for diary ♥️"
                      value={notificationForm.notificationDiaperSubtitle}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, notificationDiaperSubtitle: e.target.value }))}
                      disabled={loading}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label className="form-label">Diaper Body</Label>
                    <Input
                      type="text"
                      placeholder="Mom and Dad, please check diary in time for our baby~"
                      value={notificationForm.notificationDiaperBody}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, notificationDiaperBody: e.target.value }))}
                      disabled={loading}
                      className="w-full"
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500">Hermes docs: https://hermes.funk-isoft.com/api-docs.html</p>
                
                {/* Preview Section */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="form-label mb-3">Preview & Test</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h5 className="font-medium text-sm mb-2">Feed Notification Preview</h5>
                      <div className="text-xs space-y-1">
                        <div className="font-semibold">{notificationForm.notificationTitle}</div>
                        <div className="text-gray-600">{notificationForm.notificationFeedSubtitle}</div>
                        <div className="text-gray-500">{notificationForm.notificationFeedBody}</div>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h5 className="font-medium text-sm mb-2">Diaper Notification Preview</h5>
                      <div className="text-xs space-y-1">
                        <div className="font-semibold">{notificationForm.notificationTitle}</div>
                        <div className="text-gray-600">{notificationForm.notificationDiaperSubtitle}</div>
                        <div className="text-gray-500">{notificationForm.notificationDiaperBody}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestNotification('FEED')}
                      disabled={testingNotification || loading || !notificationForm.hermesApiKey}
                    >
                      {testingNotification ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Test Feed Notification
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestNotification('DIAPER')}
                      disabled={testingNotification || loading || !notificationForm.hermesApiKey}
                    >
                      {testingNotification ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Test Diaper Notification
                    </Button>
                  </div>
                  
                  {testResult && (
                    <div className={`p-3 rounded-md text-sm ${
                      testResult.success 
                        ? 'bg-green-50 text-green-800 border border-green-200' 
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {testResult.message}
                    </div>
                  )}
                  
                  {!notificationForm.hermesApiKey && (
                    <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                      ⚠️ Please enter your Hermes API Key to test notifications
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={handleSaveNotificationSettings}
                    disabled={savingNotifications || loading}
                  >
                    {savingNotifications ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Save Notification Settings
                  </Button>
                </div>
              </div>
            </div>

            {/* Background Monitoring Section */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="form-label mb-4">Background Monitoring</h3>
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Enable background monitoring to receive notifications even when the app is closed. 
                  The system will check all babies every 1 minute for warning thresholds.
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Monitoring Status</h4>
                      <p className="text-sm text-gray-500">
                        {monitoringStatus?.active 
                          ? `Active - Checking every ${monitoringStatus.interval} seconds`
                          : 'Inactive - No background monitoring'
                        }
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      monitoringStatus?.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {monitoringStatus?.active ? 'Running' : 'Stopped'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      onClick={startMonitoring}
                      disabled={monitoringLoading || monitoringStatus?.active}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {monitoringLoading ? 'Starting...' : 'Start Monitoring'}
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={stopMonitoring}
                      disabled={monitoringLoading || !monitoringStatus?.active}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {monitoringLoading ? 'Stopping...' : 'Stop Monitoring'}
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={runManualCheck}
                      disabled={monitoringLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {monitoringLoading ? 'Checking...' : 'Manual Check'}
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={checkMonitoringStatus}
                      disabled={monitoringLoading}
                      variant="outline"
                    >
                      Status
                    </Button>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• <strong>Start Monitoring:</strong> Begins background checking every 1 minute</p>
                  <p>• <strong>Stop Monitoring:</strong> Stops background checking</p>
                  <p>• <strong>Manual Check:</strong> Runs a one-time check immediately</p>
                  <p>• <strong>Note:</strong> Monitoring works independently of the app being open</p>
                </div>
              </div>
            </div>

            {/* Only show System Administration section in self-hosted mode */}
            {deploymentConfig?.deploymentMode !== 'saas' && (
              <div className="border-t border-slate-200 pt-6">
                <h3 className="form-label mb-4">System Administration</h3>
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    onClick={handleOpenFamilyManager}
                    className="w-full"
                    disabled={loading}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Family Manager
                  </Button>
                  <p className="text-sm text-gray-500">
                    Access system-wide family management and advanced settings
                  </p>
                </div>
              </div>
            )}
          </div>
        </FormPageContent>
        
        <FormPageFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={async () => {
            if (localSelectedBabyId || selectedBabyId) {
              await handleSaveWarningTimes();
            }
            await handleSaveNotificationSettings();
            onClose();
          }}>
            Save
          </Button>
        </FormPageFooter>
      </FormPage>

      <BabyForm
        isOpen={showBabyForm}
        onClose={handleBabyFormClose}
        isEditing={isEditing}
        baby={selectedBaby}
        onBabyChange={async () => {
          await fetchData(); // Refresh local babies list
          onBabyStatusChange?.(); // Refresh parent's babies list
        }}
      />

      <CaretakerForm
        isOpen={showCaretakerForm}
        onClose={handleCaretakerFormClose}
        isEditing={isEditing}
        caretaker={selectedCaretaker}
        onCaretakerChange={fetchData}
      />

      <ContactForm
        isOpen={showContactForm}
        onClose={handleContactFormClose}
        contact={selectedContact || undefined}
        onSave={() => fetchData()}
        onDelete={() => fetchData()}
      />

      <ChangePinModal
        open={showChangePinModal}
        onClose={() => setShowChangePinModal(false)}
        currentPin={settings?.securityPin || '111222'}
        onPinChange={(newPin) => handleSettingsChange({ securityPin: newPin })}
      />
    </>
  );
}
