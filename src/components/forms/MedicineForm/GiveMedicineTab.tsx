'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { GiveMedicineTabProps, MedicineWithContacts, MedicineLogFormData } from './medicine-form.types';
import { PillBottle, Loader2, AlertCircle, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { DateTimePicker } from '@/src/components/ui/date-time-picker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/src/components/ui/dropdown-menu';
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
  refreshData,
  setIsSubmitting,
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
  
  useEffect(() => {
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
  }, [activity]);
  
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
    const numValue = parseFloat(value);
    setFormData(prev => ({ ...prev, [name]: isNaN(numValue) ? 0 : numValue }));
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
    setIsSubmitting?.(true);
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
      
      refreshData?.();
      onSuccess?.();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setIsSubmitting?.(false);
    }
  };
  
  return (
    <form id="give-medicine-form" onSubmit={handleSubmit} className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-1">
        {isFetching ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="flex items-center text-red-500 p-2 bg-red-50 rounded-md">
                <AlertCircle className="mr-2 h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <label>Medicine</label>
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
              {errors.medicineId && <p className="text-red-500 text-sm">{errors.medicineId}</p>}
            </div>

            <div className="space-y-2">
              <label>Time</label>
              <DateTimePicker value={selectedDateTime} onChange={handleDateTimeChange} />
              {errors.time && <p className="text-red-500 text-sm">{errors.time}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="doseAmount">Dose</label>
              <div className="flex items-center space-x-2">
                <Input
                  id="doseAmount"
                  name="doseAmount"
                  type="number"
                  value={formData.doseAmount}
                  onChange={handleNumberChange}
                  className="flex-1"
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
              {errors.doseAmount && <p className="text-red-500 text-sm">{errors.doseAmount}</p>}
              {errors.unitAbbr && <p className="text-red-500 text-sm">{errors.unitAbbr}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="notes">Notes (optional)</label>
              <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} />
            </div>
          </div>
        )}
      </div>
    </form>
  );
};

export default GiveMedicineTab;
