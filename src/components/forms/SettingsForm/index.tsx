'use client';

import React, { useEffect, useState } from 'react';
import { Baby, Unit, Caretaker } from '@prisma/client';
import { Settings } from '@/app/api/types';
import { Settings as Plus, Edit, Download, Upload } from 'lucide-react';
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
import BabyForm from '@/src/components/forms/BabyForm';
import CaretakerForm from '@/src/components/forms/CaretakerForm';
import ContactForm from '@/src/components/forms/ContactForm';
import ChangePinModal from '@/src/components/modals/ChangePinModal';

interface SettingsFormProps {
  isOpen: boolean;
  onClose: () => void;
  onBabySelect?: (babyId: string) => void;
  onBabyStatusChange?: () => void;
  selectedBabyId?: string;
  familyId?: string; // Add familyId prop for multi-family support
}

export default function SettingsForm({ 
  isOpen, 
  onClose,
  onBabySelect,
  onBabyStatusChange,
  selectedBabyId,
  familyId,
}: SettingsFormProps) {
  const [settings, setSettings] = useState<Settings | null>(null);
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
  const [isRestoring, setIsRestoring] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Only set the selected baby ID if explicitly provided
    setLocalSelectedBabyId(selectedBabyId || '');
  }, [selectedBabyId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsResponse, babiesResponse, unitsResponse, caretakersResponse, contactsResponse] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/baby'),
        fetch('/api/units'),
        fetch('/api/caretaker?includeInactive=true'),
        fetch('/api/contact')
      ]);

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings(settingsData.data);
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
      const response = await fetch('/api/settings', {
        method: settings ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ...settings, 
          ...updates,
          familyId: familyId || undefined, // Include familyId in the payload
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

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

  const handleBackup = async () => {
    try {
      const response = await fetch('/api/database');
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
      alert('Failed to create backup');
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsRestoring(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/database', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Restore failed');
      }

      // Refresh the page to reflect the restored data
      window.location.reload();
    } catch (error) {
      console.error('Restore error:', error);
      alert('Failed to restore backup');
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        accept=".db"
        onChange={handleRestore}
        style={{ display: 'none' }}
      />
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
            <div className="space-y-4">
              <div>
                <Label className="form-label">Family Name</Label>
                <Input
                  disabled={loading}
                  value={settings?.familyName || ''}
                  onChange={(e) => handleSettingsChange({ familyName: e.target.value })}
                  placeholder="Enter family name"
                  className="w-full"
                />
              </div>
              
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
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleBackup}
                  className="w-full"
                  disabled={loading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Backup Data
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  disabled={loading || isRestoring}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Restore Data
                </Button>
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
          </div>
        </FormPageContent>
        
        <FormPageFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>
            Save
          </Button>
        </FormPageFooter>
      </FormPage>

      <BabyForm
        isOpen={showBabyForm}
        onClose={handleBabyFormClose}
        isEditing={isEditing}
        baby={selectedBaby}
        familyId={familyId}
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
        familyId={familyId}
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
