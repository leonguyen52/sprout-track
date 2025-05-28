'use client';

import { Caretaker as PrismaCaretaker, UserRole } from '@prisma/client';
import { useState, useEffect } from 'react';
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
import { caretakerFormStyles } from './caretaker-form.styles';

// Extended type to include the loginId field
interface Caretaker extends PrismaCaretaker {
  loginId: string;
}

interface CaretakerFormProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  caretaker: (PrismaCaretaker & { loginId?: string }) | null;
  onCaretakerChange?: () => void;
  familyId?: string; // Add familyId prop for multi-family support
}

const defaultFormData = {
  loginId: '',
  name: '',
  type: '',
  role: 'USER' as UserRole,
  inactive: false,
  securityPin: '',
  familyId: '',
};

export default function CaretakerForm({
  isOpen,
  onClose,
  isEditing,
  caretaker,
  onCaretakerChange,
  familyId, //NEEDS FINISHING
}: CaretakerFormProps) {
  const [formData, setFormData] = useState(defaultFormData);
  const [confirmPin, setConfirmPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isFirstCaretaker, setIsFirstCaretaker] = useState(false);

  // Reset form when form opens/closes or caretaker changes
  useEffect(() => {
    if (caretaker && isOpen) {
      setFormData({
        loginId: caretaker.loginId || '',
        name: caretaker.name,
        type: caretaker.type || '',
        role: caretaker.role || 'USER',
        inactive: (caretaker as any).inactive || false,
        securityPin: caretaker.securityPin,
        familyId: familyId || '',
      });
      setConfirmPin(caretaker.securityPin);
      setIsFirstCaretaker(false);
    } else if (!isOpen) {
      setFormData(defaultFormData);
      setConfirmPin('');
      setError('');
    }
  }, [caretaker, familyId, isOpen]);

  // Check if this is the first caretaker in the system
  useEffect(() => {
    if (!isEditing && isOpen) {
      const checkFirstCaretaker = async () => {
        try {
          const response = await fetch('/api/caretaker');
          if (response.ok) {
            const data = await response.json();
            const isFirst = !data.data || data.data.length === 0;
            setIsFirstCaretaker(isFirst);
            
            // If this is the first caretaker, set role to ADMIN
            if (isFirst) {
              setFormData(prev => ({ ...prev, role: 'ADMIN' }));
            }
          }
        } catch (error) {
          console.error('Error checking caretakers:', error);
        }
      };
      
      checkFirstCaretaker();
    }
  }, [isEditing, familyId, isOpen]);

  const validatePIN = () => {
    if (formData.securityPin.length < 6) {
      setError('PIN must be at least 6 digits');
      return false;
    }
    if (formData.securityPin.length > 10) {
      setError('PIN cannot be longer than 10 digits');
      return false;
    }
    if (formData.securityPin !== confirmPin) {
      setError('PINs do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate form
    if (!formData.loginId.trim()) {
      setError('Login ID is required');
      return;
    }

    if (formData.loginId.length !== 2) {
      setError('Login ID must be exactly 2 characters');
      return;
    }

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!validatePIN()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      const response = await fetch('/api/caretaker', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          id: caretaker?.id,
          familyId: formData.familyId || familyId || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save caretaker');
      }

      if (onCaretakerChange) {
        onCaretakerChange();
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving caretaker:', error);
      setError(error instanceof Error ? error.message : 'Failed to save caretaker');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormPage 
      isOpen={isOpen} 
      onClose={onClose}
      title={isEditing ? 'Edit Caretaker' : 'Add New Caretaker'}
      description={isEditing 
        ? "Update caretaker information" 
        : "Enter caretaker information to add them to the system"
      }
    >
      <form onSubmit={handleSubmit} className="h-full flex flex-col overflow-hidden">
        <FormPageContent className={caretakerFormStyles.content}>
          <div>
            <label className="form-label">Login ID</label>
            <Input
              value={formData.loginId}
              onChange={(e) => {
                const value = e.target.value;
                // Allow any input up to 2 characters
                setFormData({ ...formData, loginId: value });
              }}
              className="w-full"
              placeholder="Enter 2-digit login ID"
              maxLength={2}
              required
              autoComplete="off"
            />
            <p className="text-xs text-gray-500 mt-1">
              Login ID must be exactly 2 digits or characters (currently: {formData.loginId.length}/2)
            </p>
          </div>
          <div>
            <label className="form-label">Name</label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full"
              placeholder="Enter caretaker name"
              required
            />
          </div>
          <div>
            <label className="form-label">Type (Optional)</label>
            <Input
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full"
              placeholder="Parent, Grandparent, Nanny, etc."
            />
          </div>
          <div>
            <label className="form-label">Role</label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData({ ...formData, role: value as UserRole })
              }
              disabled={isFirstCaretaker}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">Regular User</SelectItem>
                <SelectItem value="ADMIN">Administrator</SelectItem>
              </SelectContent>
            </Select>
            {isFirstCaretaker ? (
              <p className="text-xs text-amber-600 mt-1">
                The first caretaker must be an administrator to manage the system
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Administrators have access to system settings and administrative functions
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="inactive"
              checked={formData.inactive}
              onChange={(e) => setFormData({ ...formData, inactive: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              disabled={isFirstCaretaker}
            />
            <label htmlFor="inactive" className="form-label mb-0">
              Mark as inactive
            </label>
          </div>
          {formData.inactive && (
            <p className="text-xs text-amber-600 mt-1">
              Inactive caretakers cannot log in to the system
            </p>
          )}
          <div>
            <label className="form-label">Security PIN</label>
            <Input
              type="password"
              value={formData.securityPin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 10) {
                  setFormData({ ...formData, securityPin: value });
                }
              }}
              className="w-full"
              placeholder="Enter 6-10 digit PIN"
              minLength={6}
              maxLength={10}
              pattern="\d*"
              required
            />
            <p className="text-xs text-gray-500 mt-1">PIN must be between 6 and 10 digits</p>
          </div>
          <div>
            <label className="form-label">Confirm PIN</label>
            <Input
              type="password"
              value={confirmPin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 10) {
                  setConfirmPin(value);
                }
              }}
              className="w-full"
              placeholder="Confirm PIN"
              minLength={6}
              maxLength={10}
              pattern="\d*"
              required
            />
          </div>
          
          {error && (
            <div className="text-sm text-red-500 font-medium">{error}</div>
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
              className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? 'Saving...' 
                : isEditing 
                  ? 'Save Changes' 
                  : 'Add Caretaker'
              }
            </Button>
          </div>
        </FormPageFooter>
      </form>
    </FormPage>
  );
}
