'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { medicineFormStyles as styles } from './medicine-form.styles';
import { GiveMedicineTabProps, MedicineWithContacts, MedicineLogFormData } from './medicine-form.types';
import { PillBottle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { DateTimePicker } from '@/src/components/ui/date-time-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { useTimezone } from '@/app/context/timezone';

/**
 * GiveMedicineTab Component
 * 
 * Form for recording medicine administration
 */
const GiveMedicineTab: React.FC<GiveMedicineTabProps> = ({ 
  babyId, 
  initialTime, 
  onSuccess,
  refreshData
}) => {
  const { formatDate, toUTCString } = useTimezone();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [medicines, setMedicines] = useState<MedicineWithContacts[]>([]);
  const [units, setUnits] = useState<{unitAbbr: string, unitName: string}[]>([]);
  const [selectedDateTime, setSelectedDateTime] = useState<Date>(() => {
    try {
      // Try to parse the initialTime
      const date = new Date(initialTime);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return new Date(); // Fallback to current date if invalid
      }
      return date;
    } catch (error) {
      console.error('Error parsing initialTime:', error);
      return new Date(); // Fallback to current date
    }
  });
  
  // Form data state
  const [formData, setFormData] = useState<MedicineLogFormData>({
    babyId: babyId || '',
    medicineId: '',
    time: initialTime,
    doseAmount: 0,
    unitAbbr: '',
    notes: '',
  });
  
  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Selected medicine details
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineWithContacts | null>(null);
  
  // Fetch medicines and units
  useEffect(() => {
    const fetchData = async () => {
      setIsFetching(true);
      setError(null);
      
      try {
        // Fetch active medicines
        const medicinesResponse = await fetch('/api/medicine?active=true');
        
        if (!medicinesResponse.ok) {
          throw new Error('Failed to fetch medicines');
        }
        
        const medicinesData = await medicinesResponse.json();
        
        // Fetch units
        const unitsResponse = await fetch('/api/unit');
        
        if (!unitsResponse.ok) {
          throw new Error('Failed to fetch units');
        }
        
        const unitsData = await unitsResponse.json();
        
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
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsFetching(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Handle date/time change
  const handleDateTimeChange = (date: Date) => {
    setSelectedDateTime(date);
    
    // Format the date as ISO string for storage in formData
    const formattedTime = date.toISOString();
    setFormData(prev => ({ ...prev, time: formattedTime }));
    
    // Clear error for time field
    if (errors.time) {
      setErrors(prev => ({ ...prev, time: '' }));
    }
  };
  
  // Handle medicine selection
  const handleMedicineChange = (medicineId: string) => {
    const medicine = medicines.find(m => m.id === medicineId);
    setSelectedMedicine(medicine || null);
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      medicineId,
      // Set default unit if medicine has one
      unitAbbr: medicine?.unitAbbr || prev.unitAbbr,
      // Set default dose if medicine has one
      doseAmount: medicine?.typicalDoseSize || prev.doseAmount,
    }));
    
    // Clear error for medicine field
    if (errors.medicineId) {
      setErrors(prev => ({ ...prev, medicineId: '' }));
    }
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
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Check required fields
    if (!formData.medicineId) {
      newErrors.medicineId = 'Please select a medicine';
    }
    
    if (!formData.time) {
      newErrors.time = 'Please select a time';
    }
    
    if (formData.doseAmount <= 0) {
      newErrors.doseAmount = 'Please enter a valid dose amount';
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
    
    // Check if baby ID is available
    if (!babyId) {
      setError('Baby ID is required');
      return;
    }
    
    // Update babyId in form data
    const submitData = {
      ...formData,
      babyId,
    };
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/medicine-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Reset form
        setFormData({
          babyId: babyId,
          medicineId: '',
          time: new Date().toISOString(),
          doseAmount: 0,
          unitAbbr: '',
          notes: '',
        });
        setSelectedMedicine(null);
        
        // Refresh active doses data
        refreshData();
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(data.error || 'Failed to save medicine log');
      }
    } catch (err) {
      console.error('Error saving medicine log:', err);
      setError('Failed to save medicine log. Please try again.');
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
      
      {/* Form */}
      {!isFetching && (
        <form onSubmit={handleSubmit}>
          {/* Medicine selection */}
          <div className={cn(styles.formGroup, "medicine-form-form-group")}>
            <label className={cn(styles.formLabel, "medicine-form-label")}>
              Medicine
            </label>
            <div className={cn(styles.selectContainer, "medicine-form-select-container")}>
              <Select
                value={formData.medicineId}
                onValueChange={handleMedicineChange}
                disabled={isLoading || medicines.length === 0}
              >
                <SelectTrigger className={errors.medicineId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a medicine" />
                </SelectTrigger>
                <SelectContent>
                  {medicines.map((medicine) => (
                    <SelectItem key={medicine.id} value={medicine.id}>
                      {medicine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.medicineId && (
                <p className={cn(styles.formError, "medicine-form-error")}>
                  {errors.medicineId}
                </p>
              )}
            </div>
          </div>
          
          {/* Time selection */}
          <div className={cn(styles.formGroup, "medicine-form-form-group")}>
            <label className={cn(styles.formLabel, "medicine-form-label")}>
              Time
            </label>
            <DateTimePicker
              value={selectedDateTime}
              onChange={handleDateTimeChange}
              disabled={isLoading}
            />
            {errors.time && (
              <p className={cn(styles.formError, "medicine-form-error")}>
                {errors.time}
              </p>
            )}
          </div>
          
          {/* Dose amount and unit */}
          <div className={cn(styles.formRow, "medicine-form-form-row")}>
            <div className={cn(styles.formCol, "medicine-form-form-col")}>
              <label className={cn(styles.formLabel, "medicine-form-label")}>
                Dose Amount
              </label>
              <Input
                type="number"
                name="doseAmount"
                value={formData.doseAmount || ''}
                onChange={handleNumberChange}
                min="0"
                step="0.1"
                disabled={isLoading}
                className={errors.doseAmount ? 'border-red-500' : ''}
              />
              {errors.doseAmount && (
                <p className={cn(styles.formError, "medicine-form-error")}>
                  {errors.doseAmount}
                </p>
              )}
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
                  <p className={cn(styles.formError, "medicine-form-error")}>
                    {errors.unitAbbr}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Notes */}
          <div className={cn(styles.formGroup, "medicine-form-form-group")}>
            <label className={cn(styles.formLabel, "medicine-form-label")}>
              Notes (optional)
            </label>
            <Textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Add any additional notes here"
              className="resize-none"
            />
          </div>
          
          {/* Submit button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <PillBottle className="mr-2 h-4 w-4" />
                Record Medicine
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
};

export default GiveMedicineTab;
