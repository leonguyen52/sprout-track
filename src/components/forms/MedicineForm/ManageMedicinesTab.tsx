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
        const authToken = localStorage.getItem('authToken');
        const fetchOptions = { headers: { 'Authorization': `Bearer ${authToken}` } };

        // Fetch all medicines
        const medicinesResponse = await fetch('/api/medicine', fetchOptions);
        if (!medicinesResponse.ok) throw new Error('Failed to fetch medicines');
        const medicinesData = await medicinesResponse.json();
        
        // Fetch units for medicine
        const unitsResponse = await fetch('/api/units?activityType=medicine', fetchOptions);
        if (!unitsResponse.ok) throw new Error('Failed to fetch units');
        const unitsData = await unitsResponse.json();

        // Fetch contacts
        const contactsResponse = await fetch('/api/contact', fetchOptions);
        if (!contactsResponse.ok) throw new Error('Failed to fetch contacts');
        const contactsData = await contactsResponse.json();
        
        // Update state with fetched data
        if (medicinesData.success) setMedicines(medicinesData.data);
        else setError(medicinesData.error || 'Failed to load medicines');
        
        if (unitsData.success) setUnits(unitsData.data);
        else setError(unitsData.error || 'Failed to load units');
        
        if (contactsData.success) setContacts(contactsData.data);
        else setError(contactsData.error || 'Failed to load contacts');

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
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
      
      const { ...dataToSubmit } = formData;

      const authToken = localStorage.getItem('authToken');
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(dataToSubmit),
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (isEditing) {
          setMedicines(prev => prev.map(m => 
            m.id === formData.id ? { ...m, ...data.data } : m
          ));
        } else {
          setMedicines(prev => [...prev, data.data]);
        }
        setShowMedicineForm(false);
        setSelectedMedicine(null);
        refreshData?.();
      } else {
        setError(data.error || `Failed to ${isEditing ? 'update' : 'create'} medicine`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${formData.id ? 'update' : 'create'} medicine.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle delete medicine
  const handleDeleteMedicine = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`/api/medicine?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMedicines(prev => prev.filter(m => m.id !== id));
        setShowMedicineForm(false);
        setSelectedMedicine(null);
        refreshData?.();
      } else {
        setError(data.error || 'Failed to delete medicine');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete medicine.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className={cn(styles.tabContent)}>
      {isFetching && (
        <div className="flex flex-col items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p className="mt-2 text-gray-600">Loading medicines...</p>
        </div>
      )}
      
      {error && (
        <div className="flex flex-col items-center justify-center p-6">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="mt-2 text-red-500 text-center">{error}</p>
        </div>
      )}
      
      {!isFetching && !error && !showMedicineForm && (
        <>
          <div className="flex justify-between items-center p-1 mb-2">
            <h3 className="text-lg font-semibold">Manage Medicines</h3>
            <div className="flex items-center space-x-2">
              <Label htmlFor="show-inactive">Show Inactive</Label>
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            {filteredMedicines.map(medicine => (
              <div key={medicine.id} className={cn(styles.doseCard, !medicine.active && 'opacity-60')}>
                <div className="flex items-center cursor-pointer" onClick={() => handleAccordionToggle(medicine.id)}>
                  <PillBottle className="h-5 w-5 mr-3" />
                  <div className="flex-1">
                    <p className="font-semibold">{medicine.name}</p>
                    <p className="text-sm text-gray-500">
                      Typical dose: {medicine.typicalDoseSize} {medicine.unitAbbr}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEditMedicine(medicine); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                {expandedMedicine === medicine.id && (
                  <div className="mt-2 pt-2 border-t">
                    <div className="text-sm space-y-1">
                      <p className="flex items-center"><Clock className="h-4 w-4 mr-2" /> Minimum time between doses: {medicine.doseMinTime}</p>
                      {medicine.notes && <p>{medicine.notes}</p>}
                      <div className="flex items-center pt-1">
                        <User className="h-4 w-4 mr-2" />
                        <div className="flex flex-wrap gap-1">
                          {medicine.contacts.length > 0 ? (
                            medicine.contacts.map(c => <Badge key={c.contact.id} variant="secondary">{c.contact.name}</Badge>)
                          ) : (
                            <span className="text-gray-500">No associated contacts</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <Button className="w-full mt-4" onClick={handleAddMedicine}>
            <Plus className="mr-2 h-4 w-4" /> Add New Medicine
          </Button>
        </>
      )}

      {showMedicineForm && (
        <MedicineForm
          isOpen={true}
          onClose={() => setShowMedicineForm(false)}
          medicine={selectedMedicine}
          units={units}
          contacts={contacts}
          onSave={handleSaveMedicine}
        />
      )}
    </div>
  );
};

export default ManageMedicinesTab;
