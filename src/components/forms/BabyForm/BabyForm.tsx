'use client';

import React, { useState, useEffect } from 'react';
import { Baby, Gender } from '@prisma/client';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
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
import { babyFormStyles } from './baby-form.styles';

interface BabyFormProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  baby: Baby | null;
  onBabyChange?: () => void;
}

const defaultFormData = {
  firstName: '',
  lastName: '',
  birthDate: '',
  gender: '',
  inactive: false,
  feedWarningTime: '03:00',
  diaperWarningTime: '02:00',
};

export default function BabyForm({
  isOpen,
  onClose,
  isEditing,
  baby,
  onBabyChange,
}: BabyFormProps) {
  const [formData, setFormData] = useState(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when form opens/closes or baby changes
  useEffect(() => {
    if (baby && isOpen) {
      const birthDate = baby.birthDate instanceof Date 
        ? baby.birthDate.toISOString().split('T')[0]
        : new Date(baby.birthDate as string).toISOString().split('T')[0];

      setFormData({
        firstName: baby.firstName,
        lastName: baby.lastName,
        birthDate,
        gender: baby.gender || '',
        inactive: baby.inactive || false,
        feedWarningTime: baby.feedWarningTime || '03:00',
        diaperWarningTime: baby.diaperWarningTime || '02:00',
      });
    } else if (!isOpen) {
      setFormData(defaultFormData);
    }
  }, [baby, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/baby', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          id: baby?.id,
          birthDate: new Date(formData.birthDate),
          gender: formData.gender as Gender,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save baby');
      }

      if (onBabyChange) {
        onBabyChange();
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving baby:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormPage 
      isOpen={isOpen} 
      onClose={onClose}
      title={isEditing ? 'Edit Baby' : 'Add New Baby'}
      description={isEditing 
        ? "Update your baby's information" 
        : "Enter your baby's information to start tracking"
      }
    >
      <form onSubmit={handleSubmit} className="h-full flex flex-col overflow-hidden">
        <FormPageContent className={babyFormStyles.content}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">First Name</label>
              <Input
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="w-full"
                placeholder="Enter first name"
                required
              />
            </div>
            <div>
              <label className="form-label">Last Name</label>
              <Input
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="w-full"
                placeholder="Enter last name"
                required
              />
            </div>
          </div>
          <div>
            <label className="form-label">Birth Date</label>
            <Input
              type="date"
              value={formData.birthDate}
              onChange={(e) =>
                setFormData({ ...formData, birthDate: e.target.value })
              }
              className="w-full"
              required
            />
          </div>
          <div>
            <label className="form-label">Gender</label>
            <Select
              value={formData.gender}
              onValueChange={(value) =>
                setFormData({ ...formData, gender: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Feed Warning Time (hh:mm)</label>
              <Input
                type="text"
                pattern="[0-9]{2}:[0-9]{2}"
                value={formData.feedWarningTime}
                onChange={(e) =>
                  setFormData({ ...formData, feedWarningTime: e.target.value })
                }
                className="w-full"
                placeholder="03:00"
                required
              />
            </div>
            <div>
              <label className="form-label">Diaper Warning Time (hh:mm)</label>
              <Input
                type="text"
                pattern="[0-9]{2}:[0-9]{2}"
                value={formData.diaperWarningTime}
                onChange={(e) =>
                  setFormData({ ...formData, diaperWarningTime: e.target.value })
                }
                className="w-full"
                placeholder="02:00"
                required
              />
            </div>
          </div>
          {isEditing && (
            <div className="flex items-center space-x-2 mt-4">
              <label className="form-label flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  checked={formData.inactive}
                  onChange={(e) =>
                    setFormData({ ...formData, inactive: e.target.checked })
                  }
                />
                <span className="ml-2">Mark as inactive</span>
              </label>
            </div>
          )}
        </FormPageContent>
        <FormPageFooter>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Save'}
            </Button>
          </div>
        </FormPageFooter>
      </form>
    </FormPage>
  );
}
