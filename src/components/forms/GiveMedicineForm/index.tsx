'use client';

import React, { useState, useEffect } from 'react';
import { GiveMedicineTabProps, MedicineWithContacts, MedicineLogFormData } from '../MedicineForm/medicine-form.types';
import { Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { DateTimePicker } from '@/src/components/ui/date-time-picker';
import { Label } from '@/src/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/src/components/ui/dropdown-menu';
import { 
  FormPage, 
  FormPageContent, 
  FormPageFooter 
} from '@/src/components/ui/form-page';
import { useTimezone } from '@/app/context/timezone';

interface GiveMedicineFormProps {
  isOpen: boolean;
  onClose: () => void;
  babyId: string | undefined;
  initialTime: string;
  onSuccess?: () => void;
  refreshData?: () => void;
  activity?: any;
}

/**
 * GiveMedicineForm Component
 * 
 * A standalone form for recording medicine administration
 * Follows the same pattern as other forms in the app (CaretakerForm, etc.)
 */
const GiveMedicineForm: React.FC<GiveMedicineFormProps> = ({ 
  isOpen,
  onClose,
  babyId, 
  initialTime, 
  onSuccess,
  refreshData,
  activity,
}) => {
  const { toUTCString } = useTimezone();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [medicines, setMedicines] = useState<MedicineWithContacts[]>([]);
  const [units, setUnits] = useState<{unitAbbr: string, unitName: string}[]>([]);
  const [selectedDateTime, setSelectedDateTime] = useState<Date>(() => new Date(initialTime));
  
  const [formData, setFormData] = useState<Omit<MedicineLogFormData, 'familyId'>>(() => ({
    babyId: babyId || '',
    medicineId: activity?.medicineId || '',
    time: toUTCString(new Date(initialTime)) || new Date(initialTime).toISOString(),
    doseAmount: activity?.doseAmount || 0,
    unitAbbr: activity?.unitAbbr || '',
    notes: activity?.notes || '',
  }));
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineWithContacts | null>(null);
  
  // Update form data when activity changes (for editing)
  useEffect(() => {
    if (activity) {
      setFormData({
        babyId: babyId || '',
        medicineId: activity.medicineId || '',
        time: activity.time || toUTCString(new Date(initialTime)) || new Date(initialTime).toISOString(),
        doseAmount: activity.doseAmount || 0,
        unitAbbr: activity.unitAbbr || '',
        notes: activity.notes || '',
      });
      
      // Update the selected date time as well
      if (activity.time) {
        setSelectedDateTime(new Date(activity.time));
      }
      
      // Find and set the selected medicine if we have medicines loaded
      if (medicines.length > 0 && activity.medicineId) {
        const currentMedicine = medicines.find((m: MedicineWithContacts) => m.id === activity.medicineId);
        setSelectedMedicine(currentMedicine || null);
      }
    } else {
      // Reset form for new entry
      setFormData({
        babyId: babyId || '',
        medicineId: '',
        time: toUTCString(new Date(initialTime)) || new Date(initialTime).toISOString(),
        doseAmount: 0,
        unitAbbr: '',
        notes: '',
      });
      setSelectedDateTime(new Date(initialTime));
      setSelectedMedicine(null);
    }
  }, [activity, babyId, initialTime, toUTCString, medicines]);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsFetching(true);
        setError(null);
        const authToken = localStorage.getItem('authToken');
        try {
          const fetchOptions = { headers: { 'Authorization': `Bearer ${authToken}` } };
          const medicinesResponse = await fetch('/api/medicine?active=true', fetchOptions);
          if (!medicinesResponse.ok) throw new Error('Failed to load medicines');
          const medicinesData = await medicinesResponse.json();
          if (medicinesData.success) {
            setMedicines(medicinesData.data);
            if (activity?.medicineId) {
              const currentMedicine = medicinesData.data.find((m: MedicineWithContacts) => m.id === activity.medicineId);
              setSelectedMedicine(currentMedicine || null);
            }
          } else {
            setError(medicinesData.error || 'Failed to load medicines');
          }

          const unitsResponse = await fetch('/api/units?activityType=medicine', fetchOptions);
          if (!unitsResponse.ok) throw new Error('Failed to load units');
          const unitsData = await unitsResponse.json();
          if (unitsData.success) setUnits(unitsData.data);
          else setError(unitsData.error || 'Failed to load units');

        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
          setIsFetching(false);
        }
      };
      fetchData();
    }
  }, [isOpen, activity]);
  
  const handleDateTimeChange = (date: Date) => {
    setSelectedDateTime(date);
    setFormData(prev => ({ ...prev, time: toUTCString(date) || date.toISOString() }));
    if (errors.time) setErrors(prev => ({ ...prev, time: '' }));
  };
  
  const handleMedicineChange = (medicineId: string) => {
    const medicine = medicines.find(m => m.id === medicineId);
    setSelectedMedicine(medicine || null);
    setFormData(prev => ({
      ...prev,
      medicineId,
      unitAbbr: medicine?.unitAbbr || prev.unitAbbr,
      doseAmount: medicine?.typicalDoseSize || prev.doseAmount,
    }));
    if (errors.medicineId) setErrors(prev => ({ ...prev, medicineId: '' }));
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Handle empty string case - allow it to be empty
    if (value === '') {
      setFormData(prev => ({ ...prev, [name]: 0 }));
    } else {
      const numValue = parseFloat(value);
      // Only update if it's a valid number
      if (!isNaN(numValue)) {
        setFormData(prev => ({ ...prev, [name]: numValue }));
      }
    }
    
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };
  
  const handleUnitChange = (unitAbbr: string) => {
    setFormData(prev => ({ ...prev, unitAbbr }));
    if (errors.unitAbbr) setErrors(prev => ({ ...prev, unitAbbr: '' }));
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.medicineId) newErrors.medicineId = 'Please select a medicine';
    if (!formData.time) newErrors.time = 'Please select a time';
    if (formData.doseAmount < 0) newErrors.doseAmount = 'Dose cannot be negative';
    if (formData.doseAmount > 0 && !formData.unitAbbr) newErrors.unitAbbr = 'Please select a unit';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      const payload = { ...formData };
      if (payload.doseAmount === 0) payload.unitAbbr = '';
      
      const url = activity ? `/api/medicine-log?id=${activity.id}` : '/api/medicine-log';
      const method = activity ? 'PUT' : 'POST';
      const authToken = localStorage.getItem('authToken');
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${activity ? 'update' : 'save'} log`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Clear any existing errors
        setError(null);
        
        // Refresh data first
        refreshData?.();
        
        // Then call onSuccess to close the form
        onSuccess?.();
      } else {
        throw new Error(result.error || `Failed to ${activity ? 'update' : 'save'} log`);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <FormPage
      isOpen={isOpen}
      onClose={onClose}
      title={activity ? 'Edit Medicine Log' : 'Give Medicine'}
      description={activity ? 'Update medicine administration details' : 'Record medicine administration'}
    >
      <form id="give-medicine-form" onSubmit={handleSubmit} className="h-full flex flex-col">
        <FormPageContent>
          {isFetching ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <p className="mt-2 text-gray-600">Loading form data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="flex items-center text-red-500 p-3 bg-red-50 rounded-md border border-red-200">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
              
              <div>
                <Label htmlFor="medicine">Medicine</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {selectedMedicine ? selectedMedicine.name : 'Select a medicine'}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Available Medicines</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {medicines.map(med => (
                      <DropdownMenuItem key={med.id} onSelect={() => handleMedicineChange(med.id)}>
                        {med.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {errors.medicineId && <p className="text-sm text-red-500 mt-1">{errors.medicineId}</p>}
              </div>

              <div>
                <Label htmlFor="time">Time</Label>
                <DateTimePicker value={selectedDateTime} onChange={handleDateTimeChange} />
                {errors.time && <p className="text-sm text-red-500 mt-1">{errors.time}</p>}
              </div>

              <div>
                <Label htmlFor="dose">Dose</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="doseAmount"
                    name="doseAmount"
                    type="number"
                    value={formData.doseAmount || ''}
                    onChange={handleNumberChange}
                    className="flex-1"
                    step="0.1"
                    min="0"
                    placeholder="Enter dose amount"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="min-w-[70px]">
                        {formData.unitAbbr || 'Unit'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {units.map(unit => (
                        <DropdownMenuItem key={unit.unitAbbr} onSelect={() => handleUnitChange(unit.unitAbbr)}>
                          {unit.unitName} ({unit.unitAbbr})
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {errors.doseAmount && <p className="text-sm text-red-500 mt-1">{errors.doseAmount}</p>}
                {errors.unitAbbr && <p className="text-sm text-red-500 mt-1">{errors.unitAbbr}</p>}
              </div>

              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea 
                  id="notes" 
                  name="notes" 
                  value={formData.notes} 
                  onChange={handleChange}
                  placeholder="Enter any additional notes about this medicine administration"
                />
              </div>
            </div>
          )}
        </FormPageContent>
        
        <FormPageFooter>
          <div className="flex justify-end space-x-2">
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
              disabled={isLoading || isFetching}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                activity ? 'Update' : 'Save'
              )}
            </Button>
          </div>
        </FormPageFooter>
      </form>
    </FormPage>
  );
};

export default GiveMedicineForm;
