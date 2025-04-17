'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/src/lib/utils';
import { medicineFormStyles as styles } from './medicine-form.styles';
import { ManageMedicinesTabProps, MedicineWithContacts, MedicineFormData } from './medicine-form.types';
import { 
  PillBottle, 
  Loader2, 
  AlertCircle, 
  Edit, 
  Plus, 
  ChevronRight, 
  User, 
  Clock,
  EyeOff
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Switch } from '@/src/components/ui/switch';
import { Label } from '@/src/components/ui/label';
import MedicineForm from './MedicineForm';

/**
 * ManageMedicinesTab Component
 * 
 * Interface for managing medicines and their associations with contacts
 * Uses an accordion-style list with expandable details and a form-page component for adding/editing
 */
const ManageMedicinesTab: React.FC<ManageMedicinesTabProps> = ({ refreshData }) => {
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [medicines, setMedicines] = useState<MedicineWithContacts[]>([]);
  const [units, setUnits] = useState<{unitAbbr: string, unitName: string}[]>([]);
  const [contacts, setContacts] = useState<{id: string, name: string, role: string}[]>([]);
  
  // Medicine form state
  const [showMedicineForm, setShowMedicineForm] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineWithContacts | null>(null);
  
  // Accordion state for expanded medicine details
  const [expandedMedicine, setExpandedMedicine] = useState<string | null>(null);
  
  // State for showing inactive medicines
  const [showInactive, setShowInactive] = useState(false);
  
  // Filter medicines based on active status
  const filteredMedicines = useMemo(() => {
    return medicines.filter(medicine => showInactive || medicine.active);
  }, [medicines, showInactive]);
  
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
  
  // Handle medicine edit button click
  const handleEditMedicine = (medicine: MedicineWithContacts) => {
    setSelectedMedicine(medicine);
    setShowMedicineForm(true);
  };
  
  // Handle add new medicine button click
  const handleAddMedicine = () => {
    setSelectedMedicine(null);
    setShowMedicineForm(true);
  };
  
  // Handle accordion toggle
  const handleAccordionToggle = (medicineId: string) => {
    setExpandedMedicine(expandedMedicine === medicineId ? null : medicineId);
  };
  
  // Handle save medicine
  const handleSaveMedicine = async (formData: MedicineFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const isEditing = !!formData.id;
      const method = isEditing ? 'PUT' : 'POST';
      const url = '/api/medicine' + (isEditing ? `?id=${formData.id}` : '');
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        if (isEditing) {
          setMedicines(prev => prev.map(m => 
            m.id === formData.id ? { ...m, ...data.data } : m
          ));
        } else {
          setMedicines(prev => [...prev, data.data]);
        }
        
        // Close form
        setShowMedicineForm(false);
        setSelectedMedicine(null);
        
        // Refresh parent data if needed
        if (refreshData) {
          refreshData();
        }
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
  
  // Handle delete medicine
  const handleDeleteMedicine = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/medicine?id=${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove deleted medicine from state
        setMedicines(prev => prev.filter(m => m.id !== id));
        
        // Close form if open
        setShowMedicineForm(false);
        setSelectedMedicine(null);
        
        // Refresh parent data if needed
        if (refreshData) {
          refreshData();
        }
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
    <div className={cn(styles.tabContent)}>
      {/* Loading state for initial data fetch */}
      {isFetching && (
        <div className="flex flex-col items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p className="mt-2 text-gray-600">Loading medicines...</p>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center p-6 text-red-500">
          <AlertCircle className="h-8 w-8" />
          <p className="mt-2">{error}</p>
        </div>
      )}
      
      {/* Medicines list */}
      {!isFetching && !error && (
        <>
          {/* Show inactive medicines toggle */}
          <div className="flex items-center space-x-2 mb-4">
            <Switch
              checked={showInactive}
              onCheckedChange={setShowInactive}
              id="show-inactive"
            />
            <Label htmlFor="show-inactive" className="text-sm font-medium cursor-pointer">
              Show inactive medicines
            </Label>
            {showInactive && (
              <Badge variant="outline" className="ml-auto flex items-center">
                <EyeOff className="h-3 w-3 mr-1" />
                <span>Showing inactive</span>
              </Badge>
            )}
          </div>
          
          <div className="space-y-4">
            {filteredMedicines.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <PillBottle className="h-12 w-12 mb-2 text-gray-400" />
                <p className="text-gray-500">
                  {medicines.length === 0 
                    ? "No medicines added yet" 
                    : "No active medicines found. Toggle the switch to show inactive medicines."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMedicines.map((medicine) => (
                  <div 
                    key={medicine.id} 
                    className="rounded-lg bg-gray-50 border border-gray-100 shadow-sm overflow-hidden"
                  >
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer"
                      onClick={() => handleAccordionToggle(medicine.id)}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 p-1.5 mr-2 rounded-full bg-teal-100 text-teal-600">
                          <PillBottle className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-800">{medicine.name}</div>
                          <div className="text-xs text-gray-500">
                            {medicine.typicalDoseSize && medicine.unitAbbr && (
                              <span>{medicine.typicalDoseSize} {medicine.unitAbbr}</span>
                            )}
                            {!medicine.active && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight 
                        className={`h-4 w-4 text-gray-400 transition-transform ${expandedMedicine === medicine.id ? 'rotate-90' : ''}`}
                      />
                    </div>
                    
                    {expandedMedicine === medicine.id && (
                      <div className="p-3 pt-0 border-t border-gray-100 mt-1">
                        {medicine.doseMinTime && (
                          <div className="flex items-center text-xs text-gray-600 mb-2">
                            <Clock className="h-3 w-3 mr-1 text-gray-400" />
                            <span>Min time between doses: {medicine.doseMinTime}</span>
                          </div>
                        )}
                        
                        {medicine.contacts && medicine.contacts.length > 0 && (
                          <div className="mb-2">
                            <div className="text-xs text-gray-500 mb-1">Associated contacts:</div>
                            <div className="flex flex-wrap gap-1">
                              {medicine.contacts.map(c => (
                                <Badge key={c.contact.id} variant="secondary" className="text-xs flex items-center">
                                  <User className="h-3 w-3 mr-1" />
                                  {c.contact.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditMedicine(medicine);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-center mt-4">
              <Button
                onClick={handleAddMedicine}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Medicine
              </Button>
            </div>
          </div>
          
          {/* Medicine Form using FormPage component */}
          <MedicineForm
            isOpen={showMedicineForm}
            onClose={() => setShowMedicineForm(false)}
            medicine={selectedMedicine}
            units={units}
            contacts={contacts}
            onSave={handleSaveMedicine}
          />
        </>
      )}
    </div>
  );
};

export default ManageMedicinesTab;
