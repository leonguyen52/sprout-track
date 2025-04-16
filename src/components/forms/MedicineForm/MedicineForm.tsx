'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { medicineFormStyles as styles } from './medicine-form.styles';
import { MedicineFormData } from './medicine-form.types';
import { PillBottle, Loader2, AlertCircle, Trash2, Clock, User, Check } from 'lucide-react';
import { FormPage, FormPageContent, FormPageFooter } from '@/src/components/ui/form-page';
import { Input } from '@/src/components/ui/input';
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
import { Checkbox } from '@/src/components/ui/checkbox';
import { Badge } from '@/src/components/ui/badge';

interface MedicineFormProps {
  isOpen: boolean;
  onClose: () => void;
  medicine?: any;
  units: {unitAbbr: string, unitName: string}[];
  contacts: {id: string, name: string, role: string}[];
  onSave: (formData: MedicineFormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
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
  onDelete,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Initialize form data
  const [formData, setFormData] = useState<MedicineFormData>(() => {
    if (medicine) {
      return {
        id: medicine.id,
        name: medicine.name,
        typicalDoseSize: medicine.typicalDoseSize,
        unitAbbr: medicine.unitAbbr || '',
        doseMinTime: medicine.doseMinTime || '',
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
        active: medicine.active,
        contactIds: medicine.contacts?.map((c: any) => c.contact.id) || [],
      });
    } else {
      setFormData({
        name: '',
        typicalDoseSize: undefined,
        unitAbbr: '',
        doseMinTime: '',
        active: true,
        contactIds: [],
      });
    }
    // Reset errors when form data changes
    setErrors({});
  }, [medicine, isOpen]);
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  
  // Handle contact selection
  const handleContactToggle = (contactId: string, checked: boolean) => {
    setFormData(prev => {
      const currentContactIds = [...(prev.contactIds || [])];
      
      if (checked && !currentContactIds.includes(contactId)) {
        return { ...prev, contactIds: [...currentContactIds, contactId] };
      } else if (!checked && currentContactIds.includes(contactId)) {
        return { ...prev, contactIds: currentContactIds.filter(id => id !== contactId) };
      }
      
      return prev;
    });
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
  
  // Handle medicine deletion
  const handleDelete = async () => {
    if (!medicine?.id || !onDelete) return;
    
    setIsLoading(true);
    
    try {
      await onDelete(medicine.id);
      onClose();
    } catch (error) {
      console.error('Error deleting medicine:', error);
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
      <form onSubmit={handleSubmit}>
        <FormPageContent>
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
                <Input
                  type="text"
                  name="doseMinTime"
                  value={formData.doseMinTime}
                  onChange={handleChange}
                  className="w-full pl-9"
                  placeholder="Format: HH:MM (e.g., 06:00)"
                />
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
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
            
            {/* Associated Contacts */}
            {contacts.length > 0 && (
              <div className={styles.formGroup}>
                <Label htmlFor="contacts" className={styles.formLabel}>
                  Associated Contacts
                </Label>
                <div className="space-y-2 mt-1 max-h-40 overflow-y-auto p-2 border rounded-md">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`contact-${contact.id}`}
                        checked={formData.contactIds?.includes(contact.id)}
                        onCheckedChange={(checked) => 
                          handleContactToggle(contact.id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`contact-${contact.id}`}
                        className="text-sm font-medium leading-none flex items-center"
                      >
                        <User className="h-3 w-3 mr-1 text-gray-500" />
                        {contact.name}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {contact.role}
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </FormPageContent>
        
        <FormPageFooter>
          <div className="flex justify-between w-full">
            {/* Delete button (only shown when editing) */}
            {medicine && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete
              </Button>
            )}
            
            {/* Right-aligned buttons */}
            <div className="flex space-x-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              
              <Button 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    {medicine ? 'Update Medicine' : 'Save Medicine'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </FormPageFooter>
      </form>
    </FormPage>
  );
};

export default MedicineForm;
