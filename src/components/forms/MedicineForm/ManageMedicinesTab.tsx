'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { medicineFormStyles as styles } from './medicine-form.styles';
import { ManageMedicinesTabProps, MedicineWithContacts, MedicineFormData } from './medicine-form.types';
import { PillBottle, Loader2, AlertCircle, Edit, Trash2, Plus, Check, X, User } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Switch } from '@/src/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/src/components/ui/accordion';
import { Badge } from '@/src/components/ui/badge';
import { Checkbox } from '@/src/components/ui/checkbox';

/**
 * ManageMedicinesTab Component
 * 
 * Interface for managing medicines and their associations with contacts
 */
const ManageMedicinesTab: React.FC<ManageMedicinesTabProps> = ({ refreshData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [medicines, setMedicines] = useState<MedicineWithContacts[]>([]);
  const [units, setUnits] = useState<{unitAbbr: string, unitName: string}[]>([]);
  const [contacts, setContacts] = useState<{id: string, name: string, role: string}[]>([]);
  
  // Dialog states
  const [showMedicineDialog, setShowMedicineDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Form data and errors
  const [formData, setFormData] = useState<MedicineFormData>({
    name: '',
    typicalDoseSize: undefined,
    unitAbbr: '',
    doseMinTime: '',
    active: true,
    contactIds: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedMedicineId, setSelectedMedicineId] = useState<string | null>(null);
  
  // Fetch medicines, units, and contacts
  useEffect(() => {
    const fetchData = async () => {
      setIsFetching(true);
      setError(null);
      
      try {
        // Fetch all medicines
        const medicinesResponse = await fetch('/api/medicine');
        
        if (!medicinesResponse.ok) {
          throw new Error('Failed to fetch medicines');
        }
        
        const medicinesData = await medicinesResponse.json();
        
        // Fetch units
        const unitsResponse = await fetch('/api/units');
        
        if (!unitsResponse.ok) {
          throw new Error('Failed to fetch units');
        }
        
        const unitsData = await unitsResponse.json();
        
        // Fetch contacts
        const contactsResponse = await fetch('/api/contact');
        
        if (!contactsResponse.ok) {
          throw new Error('Failed to fetch contacts');
        }
        
        const contactsData = await contactsResponse.json();
        
        // Update state with fetched data
        if (medicinesData.success) {
          setMedicines(medicinesData.data);
        } else {
          setError(medicinesData.error || 'Failed to load medicines');
        }
        
        if (unitsData.success) {
          setUnits(unitsData.data);
        } else {
          setError(unitsData.error || 'Failed to load units');
        }
        
        if (contactsData.success) {
          setContacts(contactsData.data);
        } else {
          setError(contactsData.error || 'Failed to load contacts');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsFetching(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Reset form data
  const resetForm = () => {
    setFormData({
      name: '',
      typicalDoseSize: undefined,
      unitAbbr: '',
      doseMinTime: '',
      active: true,
      contactIds: [],
    });
    setErrors({});
    setSelectedMedicineId(null);
  };
  
  // Open medicine dialog for adding a new medicine
  const handleAddMedicine = () => {
    resetForm();
    setShowMedicineDialog(true);
  };
  
  // Open medicine dialog for editing an existing medicine
  const handleEditMedicine = (medicine: MedicineWithContacts) => {
    // Extract contact IDs from medicine.contacts
    const contactIds = medicine.contacts.map(c => c.contact.id);
    
    setFormData({
      id: medicine.id,
      name: medicine.name,
      typicalDoseSize: medicine.typicalDoseSize || undefined,
      unitAbbr: medicine.unitAbbr || '',
      doseMinTime: medicine.doseMinTime || '',
      active: medicine.active,
      contactIds,
    });
    setSelectedMedicineId(medicine.id);
    setShowMedicineDialog(true);
  };
  
  // Open delete confirmation dialog
  const handleDeleteClick = (medicineId: string) => {
    setSelectedMedicineId(medicineId);
    setShowDeleteDialog(true);
  };
  
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
    } else if (value === '') {
      // Allow empty value
      setFormData(prev => ({ ...prev, [name]: undefined }));
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
  
  // Handle active toggle
  const handleActiveChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, active: checked }));
  };
  
  // Handle contact selection
  const handleContactChange = (contactId: string, checked: boolean) => {
    setFormData(prev => {
      const currentContactIds = prev.contactIds || [];
      
      if (checked) {
        // Add contact ID if it's not already in the array
        return {
          ...prev,
          contactIds: [...currentContactIds, contactId]
        };
      } else {
        // Remove contact ID
        return {
          ...prev,
          contactIds: currentContactIds.filter(id => id !== contactId)
        };
      }
    });
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Check required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Medicine name is required';
    }
    
    // Validate time format if provided
    if (formData.doseMinTime) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(formData.doseMinTime)) {
        newErrors.doseMinTime = 'Time must be in format HH:MM';
      }
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
    setError(null);
    
    try {
      const isEditing = !!formData.id;
      const url = isEditing ? `/api/medicine?id=${formData.id}` : '/api/medicine';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh medicines list
        const medicinesResponse = await fetch('/api/medicine');
        const medicinesData = await medicinesResponse.json();
        
        if (medicinesData.success) {
          setMedicines(medicinesData.data);
        }
        
        // Close dialog and reset form
        setShowMedicineDialog(false);
        resetForm();
        
        // Refresh parent data if needed
        refreshData();
      } else {
        setError(data.error || `Failed to ${isEditing ? 'update' : 'create'} medicine`);
      }
    } catch (err) {
      console.error(`Error ${formData.id ? 'updating' : 'creating'} medicine:`, err);
      setError(`Failed to ${formData.id ? 'update' : 'create'} medicine. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle medicine deletion
  const handleDelete = async () => {
    if (!selectedMedicineId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/medicine?id=${selectedMedicineId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove deleted medicine from state
        setMedicines(prev => prev.filter(m => m.id !== selectedMedicineId));
        
        // Close dialog
        setShowDeleteDialog(false);
        setSelectedMedicineId(null);
        
        // Refresh parent data if needed
        refreshData();
      } else {
        setError(data.error || 'Failed to delete medicine');
      }
    } catch (err) {
      console.error('Error deleting medicine:', err);
      setError('Failed to delete medicine. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className={cn(styles.tabContent, "medicine-form-tab-content")}>
      {/* Loading state for initial data fetch */}
      {isFetching && (
        <div className={cn(styles.loadingContainer, "medicine-form-loading-container")}>
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p className="mt-2 text-gray-600">Loading medicines...</p>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className={cn(styles.errorContainer, "medicine-form-error-container")}>
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="mt-2 text-red-500">{error}</p>
        </div>
      )}
      
      {/* Medicines list */}
      {!isFetching && (
        <>
          <div className={cn(styles.medicinesList, "medicine-form-medicines-list")}>
            {medicines.length === 0 ? (
              <div className={cn(styles.emptyState, "medicine-form-empty-state")}>
                <PillBottle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No medicines added yet</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {medicines.map((medicine) => (
                  <AccordionItem key={medicine.id} value={medicine.id}>
                    <AccordionTrigger className={cn(
                      styles.medicineItem,
                      "medicine-form-medicine-item",
                      medicine.active ? styles.medicineItemActive : styles.medicineItemInactive,
                      medicine.active ? "medicine-form-medicine-item-active" : "medicine-form-medicine-item-inactive"
                    )}>
                      <div className="flex items-center">
                        <div className={cn(styles.iconContainer, "medicine-form-icon-container mr-2")}>
                          <PillBottle className="h-4 w-4" />
                        </div>
                        <div className={cn(styles.medicineDetails, "medicine-form-medicine-details")}>
                          <span className="font-medium">{medicine.name}</span>
                          {medicine.typicalDoseSize && medicine.unitAbbr && (
                            <span className="text-sm text-gray-500 ml-2">
                              ({medicine.typicalDoseSize} {medicine.unitAbbr})
                            </span>
                          )}
                          {!medicine.active && (
                            <Badge variant="outline" className="ml-2 bg-gray-100 text-gray-500">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-2 space-y-3">
                        {medicine.doseMinTime && (
                          <div className="text-sm">
                            <span className="font-medium">Minimum time between doses:</span>{' '}
                            {medicine.doseMinTime}
                          </div>
                        )}
                        
                        {medicine.contacts.length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium">Associated contacts:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {medicine.contacts.map(c => (
                                <Badge key={c.contact.id} variant="secondary" className="flex items-center">
                                  <User className="h-3 w-3 mr-1" />
                                  {c.contact.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex space-x-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditMedicine(medicine)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(medicine.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
          
          {/* Add medicine button */}
          <Button
            className={cn(styles.addButton, "medicine-form-add-button")}
            onClick={handleAddMedicine}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Medicine
          </Button>
          
          {/* Medicine form dialog */}
          <Dialog open={showMedicineDialog} onOpenChange={setShowMedicineDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {formData.id ? 'Edit Medicine' : 'Add New Medicine'}
                </DialogTitle>
                <DialogDescription>
                  {formData.id
                    ? 'Update medicine details and associated contacts'
                    : 'Add a new medicine to the system'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className={cn(styles.medicineForm, "medicine-form-medicine-form")}>
                {/* Medicine name */}
                <div className={cn(styles.formGroup, "medicine-form-form-group")}>
                  <label className={cn(styles.formLabel, "medicine-form-label")}>
                    Medicine Name *
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className={cn(styles.formError, "medicine-form-error")}>
                      {errors.name}
                    </p>
                  )}
                </div>
                
                {/* Typical dose and unit */}
                <div className={cn(styles.formRow, "medicine-form-form-row")}>
                  <div className={cn(styles.formCol, "medicine-form-form-col")}>
                    <label className={cn(styles.formLabel, "medicine-form-label")}>
                      Typical Dose Size
                    </label>
                    <Input
                      type="number"
                      name="typicalDoseSize"
                      value={formData.typicalDoseSize ?? ''}
                      onChange={handleNumberChange}
                      min="0"
                      step="0.1"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className={cn(styles.formCol, "medicine-form-form-col")}>
                    <label className={cn(styles.formLabel, "medicine-form-label")}>
                      Unit
                    </label>
                    <div className={cn(styles.selectContainer, "medicine-form-select-container")}>
                      <Select
                        value={formData.unitAbbr || ''}
                        onValueChange={handleUnitChange}
                        disabled={isLoading || units.length === 0}
                      >
                        <SelectTrigger>
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
                    </div>
                  </div>
                </div>
                
                {/* Minimum time between doses */}
                <div className={cn(styles.formGroup, "medicine-form-form-group")}>
                  <label className={cn(styles.formLabel, "medicine-form-label")}>
                    Minimum Time Between Doses (HH:MM)
                  </label>
                  <Input
                    name="doseMinTime"
                    value={formData.doseMinTime || ''}
                    onChange={handleChange}
                    placeholder="04:00"
                    disabled={isLoading}
                    className={errors.doseMinTime ? 'border-red-500' : ''}
                  />
                  {errors.doseMinTime && (
                    <p className={cn(styles.formError, "medicine-form-error")}>
                      {errors.doseMinTime}
                    </p>
                  )}
                </div>
                
                {/* Active status */}
                <div className="flex items-center space-x-2 py-2">
                  <Switch
                    checked={formData.active}
                    onCheckedChange={handleActiveChange}
                    disabled={isLoading}
                  />
                  <label className={cn(styles.formLabel, "medicine-form-label cursor-pointer")}>
                    Active
                  </label>
                </div>
                
                {/* Associated contacts */}
                <div className={cn(styles.contactsSection, "medicine-form-contacts-section")}>
                  <h3 className={cn(styles.contactsHeader, "medicine-form-contacts-header")}>
                    Associated Contacts (e.g., prescribing doctor)
                  </h3>
                  
                  {contacts.length === 0 ? (
                    <p className="text-sm text-gray-500">No contacts available</p>
                  ) : (
                    <div className={cn(styles.contactsList, "medicine-form-contacts-list")}>
                      {contacts.map((contact) => (
                        <div key={contact.id} className={cn(styles.contactItem, "medicine-form-contact-item")}>
                          <Checkbox
                            id={`contact-${contact.id}`}
                            checked={(formData.contactIds || []).includes(contact.id)}
                            onCheckedChange={(checked) => 
                              handleContactChange(contact.id, checked === true)
                            }
                            disabled={isLoading}
                          />
                          <label
                            htmlFor={`contact-${contact.id}`}
                            className={cn(styles.contactName, "medicine-form-contact-name")}
                          >
                            {contact.name} ({contact.role})
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <DialogFooter className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMedicineDialog(false)}
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
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        {formData.id ? 'Update' : 'Save'}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          {/* Delete confirmation dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this medicine? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default ManageMedicinesTab;
