'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { medicineFormStyles as styles } from './medicine-form.styles';
import { MedicineFormData } from './medicine-form.types';
import { PillBottle, Loader2, AlertCircle, Clock, User, Check, FileText } from 'lucide-react';
import { FormPage, FormPageContent, FormPageFooter } from '@/src/components/ui/form-page';
import { Input } from '@/src/components/ui/input';
import { TimeInput } from '@/src/components/ui/time-input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { Switch } from '@/src/components/ui/switch';
import { Label } from '@/src/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Contact } from '@/src/components/CalendarEvent/calendar-event.types';
import ContactSelector from './ContactSelector';

interface MedicineFormProps {
  isOpen: boolean;
  onClose: () => void;
  medicine?: any;
  units: {unitAbbr: string, unitName: string}[];
  contacts: {id: string, name: string, role: string}[];
  onSave: (formData: MedicineFormData) => Promise<void>;
}

/**
 * MedicineForm Component
 * 
 * A form for creating and editing medicines.
 * Includes fields for medicine details and contact associations.
 */
const MedicineForm: React.FC<MedicineFormProps> = ({
  isOpen,
  onClose,
  medicine,
  units,
  contacts,
  onSave,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Convert contacts to Contact type
  const convertedContacts: Contact[] = contacts.map(c => ({
    id: c.id,
    name: c.name,
    role: c.role,
    phone: null,
    email: null,
    address: null,
    notes: null
  }));
  
  // State for contacts
  const [localContacts, setLocalContacts] = useState<Contact[]>(convertedContacts);
  
  // Initialize form data
  const [formData, setFormData] = useState<MedicineFormData>(() => {
    if (medicine) {
      return {
        id: medicine.id,
        name: medicine.name,
        typicalDoseSize: medicine.typicalDoseSize,
        unitAbbr: medicine.unitAbbr || '',
        doseMinTime: medicine.doseMinTime || '',
        notes: medicine.notes || '',
        active: medicine.active,
        contactIds: medicine.contacts?.map((c: any) => c.contact.id) || [],
      };
    }
    
    // Default values for new medicine
    return {
      name: '',
      typicalDoseSize: undefined,
      unitAbbr: '',
      doseMinTime: '',
      notes: '',
      active: true,
      contactIds: [],
    };
  });
  
  // Update form data when medicine changes or when form opens/closes
  useEffect(() => {
    if (medicine) {
      setFormData({
        id: medicine.id,
        name: medicine.name,
        typicalDoseSize: medicine.typicalDoseSize,
        unitAbbr: medicine.unitAbbr || '',
        doseMinTime: medicine.doseMinTime || '',
        notes: medicine.notes || '',
        active: medicine.active,
        contactIds: medicine.contacts?.map((c: any) => c.contact.id) || [],
      });
    } else {
      setFormData({
        name: '',
        typicalDoseSize: undefined,
        unitAbbr: '',
        doseMinTime: '',
        notes: '',
        active: true,
        contactIds: [],
      });
    }
    // Reset errors when form data changes
    setErrors({});
  }, [medicine, isOpen]);
  
  // Update local contacts when props change
  useEffect(() => {
    // Convert contacts to Contact type
    const newContacts: Contact[] = contacts.map(c => ({
      id: c.id,
      name: c.name,
      role: c.role,
      phone: null,
      email: null,
      address: null,
      notes: null
    }));
    setLocalContacts(newContacts);
  }, [contacts]);
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for the field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Handle number input changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    
    if (!isNaN(numValue)) {
      setFormData(prev => ({ ...prev, [name]: numValue }));
      
      // Clear error for the field
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
  };
  
  // Handle unit selection
  const handleUnitChange = (unitAbbr: string) => {
    setFormData(prev => ({ ...prev, unitAbbr }));
    
    // Clear error for unit field
    if (errors.unitAbbr) {
      setErrors(prev => ({ ...prev, unitAbbr: '' }));
    }
  };
  
  // Handle active state toggle
  const handleActiveToggle = (checked: boolean) => {
    setFormData(prev => ({ ...prev, active: checked }));
  };
  
  // Handle contact selection change
  const handleContactsChange = (contactIds: string[]) => {
    setFormData(prev => ({ ...prev, contactIds }));
  };
  
  // Handle adding a new contact
  const handleAddContact = (newContact: Contact) => {
    // Add the new contact to our local contacts list
    setLocalContacts(prev => {
      // Check if the contact already exists
      if (!prev.some(c => c.id === newContact.id)) {
        return [...prev, newContact];
      }
      return prev;
    });
    
    // Select the new contact
    setFormData(prev => ({
      ...prev,
      contactIds: [...(prev.contactIds || []), newContact.id]
    }));
  };
  
  // Handle editing a contact
  const handleEditContact = (updatedContact: Contact) => {
    // Update the contact in our local contacts list
    setLocalContacts(prev => 
      prev.map(c => c.id === updatedContact.id ? updatedContact : c)
    );
  };
  
  // Handle deleting a contact
  const handleDeleteContact = (contactId: string) => {
    // Remove the contact from our local contacts list
    setLocalContacts(prev => prev.filter(c => c.id !== contactId));
    
    // Remove the contact from the selected contacts if it's selected
    if (formData.contactIds?.includes(contactId)) {
      setFormData(prev => ({
        ...prev,
        contactIds: prev.contactIds?.filter(id => id !== contactId) || []
      }));
    }
  };
  
  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.typicalDoseSize !== undefined && formData.typicalDoseSize <= 0) {
      newErrors.typicalDoseSize = 'Dose size must be greater than 0';
    }
    
    if (formData.typicalDoseSize && !formData.unitAbbr) {
      newErrors.unitAbbr = 'Unit is required when dose size is specified';
    }
    
    // Update errors state
    setErrors(newErrors);
    
    // Form is valid if there are no errors
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving medicine:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  
  return (
    <FormPage
      isOpen={isOpen}
      onClose={onClose}
      title={medicine ? `Edit ${medicine.name}` : 'Add New Medicine'}
      description={medicine ? 'Update medicine details' : 'Add a new medicine to track'}
    >
      <FormPageContent>
        <form id="medicine-form" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Medicine Name */}
            <div className={styles.formGroup}>
              <Label htmlFor="name" className={styles.formLabel}>
                Medicine Name
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-9"
                  placeholder="Enter medicine name"
                />
                <PillBottle className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              {errors.name && (
                <div className="text-xs text-red-500 mt-1">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  {errors.name}
                </div>
              )}
            </div>
            
            {/* Typical Dose Size and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div className={styles.formGroup}>
                <Label htmlFor="typicalDoseSize" className={styles.formLabel}>
                  Typical Dose Size
                </Label>
                <Input
                  type="number"
                  name="typicalDoseSize"
                  value={formData.typicalDoseSize || ''}
                  onChange={handleNumberChange}
                  min="0"
                  step="0.1"
                  placeholder="Enter typical dose"
                />
                {errors.typicalDoseSize && (
                  <div className="text-xs text-red-500 mt-1">
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    {errors.typicalDoseSize}
                  </div>
                )}
              </div>
              
              <div className={styles.formGroup}>
                <Label htmlFor="unitAbbr" className={styles.formLabel}>
                  Unit
                </Label>
                <Select
                  value={formData.unitAbbr}
                  onValueChange={handleUnitChange}
                >
                  <SelectTrigger className={errors.unitAbbr ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.unitAbbr} value={unit.unitAbbr}>
                        {unit.unitName} ({unit.unitAbbr})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unitAbbr && (
                  <div className="text-xs text-red-500 mt-1">
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    {errors.unitAbbr}
                  </div>
                )}
              </div>
            </div>
            
            {/* Minimum Time Between Doses */}
            <div className={styles.formGroup}>
              <Label htmlFor="doseMinTime" className={styles.formLabel}>
                Minimum Time Between Doses
              </Label>
              <div className="relative">
                <div className="relative">
                  <TimeInput
                    name="doseMinTime"
                    value={formData.doseMinTime}
                    onChange={handleChange}
                    className="w-full pl-9"
                    errorMessage="Please enter a valid time in HH:MM format"
                  />
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 z-10" />
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Format: Hours:Minutes (e.g., 06:00 for 6 hours)
              </div>
            </div>
            
            {/* Active Status */}
            <div className="flex items-center space-x-2 py-2">
              <Switch
                checked={formData.active}
                onCheckedChange={handleActiveToggle}
                id="active-status"
              />
              <Label
                htmlFor="active-status"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Active Medicine
              </Label>
            </div>
            
            {/* Notes */}
            <div className={styles.formGroup}>
              <Label htmlFor="notes" className={styles.formLabel}>
                Notes
              </Label>
              <div className="relative">
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleChange}
                  className="w-full min-h-[100px] pl-9"
                  placeholder="Enter additional notes about this medicine"
                />
                <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            {/* Associated Contacts */}
            <div className={styles.formGroup}>
              <Label htmlFor="contacts" className={styles.formLabel}>
                Associated Contacts
              </Label>
              <ContactSelector
                contacts={localContacts}
                selectedContactIds={formData.contactIds || []}
                onContactsChange={handleContactsChange}
                onAddNewContact={handleAddContact}
                onEditContact={handleEditContact}
                onDeleteContact={handleDeleteContact}
              />
            </div>
          </div>
        </form>
      </FormPageContent>
      
      <FormPageFooter>
        <div className="flex justify-end w-full space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          <Button 
            form="medicine-form"
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (medicine ? 'Update' : 'Save')}
          </Button>
        </div>
      </FormPageFooter>
    </FormPage>
  );
};

export default MedicineForm;
