'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Checkbox } from '@/src/components/ui/checkbox';
import { 
  FormPage, 
  FormPageContent, 
  FormPageFooter 
} from '@/src/components/ui/form-page';
import { AlertCircle, Loader2 } from 'lucide-react';

interface Family {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FamilyFormProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  family: Family | null;
  onFamilyChange?: () => void;
}

const defaultFormData = {
  name: '',
  slug: '',
  isActive: true,
};

export default function FamilyForm({
  isOpen,
  onClose,
  isEditing,
  family,
  onFamilyChange,
}: FamilyFormProps) {
  const [formData, setFormData] = useState(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugValidation, setSlugValidation] = useState({
    isChecking: false,
    isValid: true,
    message: '',
  });

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  // Reset form when form opens/closes or family changes
  useEffect(() => {
    if (family && isOpen) {
      setFormData({
        name: family.name,
        slug: family.slug,
        isActive: family.isActive,
      });
    } else if (!isOpen) {
      setFormData(defaultFormData);
      setSlugValidation({ isChecking: false, isValid: true, message: '' });
    }
  }, [family, isOpen]);

  // Auto-generate slug when name changes (only for new families)
  useEffect(() => {
    if (!isEditing && formData.name) {
      const newSlug = generateSlug(formData.name);
      setFormData(prev => ({ ...prev, slug: newSlug }));
    }
  }, [formData.name, isEditing]);

  // Debounced slug validation
  useEffect(() => {
    if (!formData.slug) {
      setSlugValidation({ isChecking: false, isValid: true, message: '' });
      return;
    }

    const timeoutId = setTimeout(async () => {
      await validateSlug(formData.slug);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.slug, family?.id]);

  const validateSlug = async (slug: string) => {
    if (!slug) return;

    setSlugValidation({ isChecking: true, isValid: true, message: '' });

    try {
      const response = await fetch(`/api/family/by-slug/${encodeURIComponent(slug)}`);
      const data = await response.json();

      if (response.ok && data.success && data.family) {
        // Slug exists - check if it's the current family being edited
        const isCurrentFamily = family?.id === data.family.id;
        
        if (isCurrentFamily) {
          setSlugValidation({ isChecking: false, isValid: true, message: '' });
        } else {
          setSlugValidation({ 
            isChecking: false, 
            isValid: false, 
            message: 'This slug is already taken by another family' 
          });
        }
      } else if (response.status === 404) {
        // Slug doesn't exist - it's available
        setSlugValidation({ isChecking: false, isValid: true, message: '' });
      } else {
        // Some other error
        setSlugValidation({ 
          isChecking: false, 
          isValid: true, 
          message: 'Unable to validate slug' 
        });
      }
    } catch (error) {
      console.error('Error validating slug:', error);
      setSlugValidation({ 
        isChecking: false, 
        isValid: true, 
        message: 'Unable to validate slug' 
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isActive: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !slugValidation.isValid) return;

    // Basic validation
    if (!formData.name.trim()) {
      alert('Please enter a family name');
      return;
    }

    if (!formData.slug.trim()) {
      alert('Please enter a family slug');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        isActive: formData.isActive,
        ...(isEditing && family ? { id: family.id } : {}),
      };

      const url = '/api/family/manage';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        if (onFamilyChange) {
          onFamilyChange();
        }
        onClose();
      } else {
        alert(`Error: ${data.error || 'Failed to save family'}`);
      }
    } catch (error) {
      console.error('Error saving family:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormPage 
      isOpen={isOpen} 
      onClose={onClose}
      title={isEditing ? 'Edit Family' : 'Add New Family'}
      description={isEditing 
        ? "Update the family information" 
        : "Create a new family to start tracking"
      }
    >
      <form onSubmit={handleSubmit} className="h-full flex flex-col overflow-hidden">
        <FormPageContent>
          <div className="space-y-6">
            {/* Family Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="form-label">
                Family Name
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter family name"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Family Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug" className="form-label">
                Family Slug
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="Enter family slug"
                  required
                  disabled={isSubmitting}
                  className={`pr-8 ${!slugValidation.isValid ? 'border-red-500' : ''}`}
                />
                {slugValidation.isChecking && (
                  <div className="absolute right-2 top-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500">
                This will be used in the URL (e.g., /{formData.slug || 'family-slug'}/login)
              </div>
              {!slugValidation.isValid && slugValidation.message && (
                <div className="flex items-center text-xs text-red-500">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {slugValidation.message}
                </div>
              )}
            </div>

            {/* Active Status (only for editing) */}
            {isEditing && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={handleCheckboxChange}
                  disabled={isSubmitting}
                />
                <Label htmlFor="isActive" className="form-label cursor-pointer">
                  Active family
                </Label>
              </div>
            )}
          </div>
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
              disabled={isSubmitting || !slugValidation.isValid || slugValidation.isChecking}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                isEditing ? 'Update' : 'Create'
              )}
            </Button>
          </div>
        </FormPageFooter>
      </form>
    </FormPage>
  );
} 