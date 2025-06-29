'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Search, ChevronDown, Users, ArrowRight } from 'lucide-react';
import { useTheme } from '@/src/context/theme';
import { FamilyResponse } from '@/app/api/types';
import './family-select.css';

export default function FamilySelectPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [families, setFamilies] = useState<FamilyResponse[]>([]);
  const [filteredFamilies, setFilteredFamilies] = useState<FamilyResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedFamily, setSelectedFamily] = useState<FamilyResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load families
  useEffect(() => {
    const loadFamilies = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/family/public-list');
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            setFamilies(data.data);
            setFilteredFamilies(data.data);
          }
        }
      } catch (error) {
        console.error('Error loading families:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFamilies();
  }, []);

  // Filter families based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredFamilies(families);
      setDropdownOpen(false);
    } else {
      const filtered = families.filter(family => 
        family.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        family.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFamilies(filtered);
      setDropdownOpen(true);
    }
    setHighlightedIndex(-1);
  }, [searchTerm, families]);

  // Check if already authenticated on page load
  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const unlockTime = localStorage.getItem('unlockTime');
    
    if (authToken && unlockTime) {
      try {
        const payload = authToken.split('.')[1];
        const decodedPayload = JSON.parse(atob(payload));
        
        if (decodedPayload.exp && decodedPayload.exp * 1000 > Date.now()) {
          if (decodedPayload.familySlug) {
            router.push(`/${decodedPayload.familySlug}/log-entry`);
            return;
          }
        }
      } catch (error) {
        console.error('Error parsing JWT token:', error);
      }
    }
  }, [router]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedFamily(null);
    setHighlightedIndex(-1);
  };

  const handleSearchFocus = () => {
    if (searchTerm.trim() !== '') {
      setDropdownOpen(true);
    }
  };

  const handleFamilySelect = (family: FamilyResponse) => {
    setSelectedFamily(family);
    setSearchTerm(family.name);
    setDropdownOpen(false);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const handleProceed = () => {
    if (selectedFamily) {
      router.push(`/${selectedFamily.slug}/login`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setDropdownOpen(true);
        e.preventDefault();
      }
      return;
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredFamilies.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredFamilies.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredFamilies.length) {
          handleFamilySelect(filteredFamilies[highlightedIndex]);
        } else if (filteredFamilies.length === 1) {
          handleFamilySelect(filteredFamilies[0]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setDropdownOpen(false);
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white family-select-container">
        <div className="text-center">
          <div className="w-24 h-24 p-1 flex items-center justify-center mb-4">
            <Image
              src="/sprout-128.png"
              alt="Sprout Logo"
              width={128}
              height={128}
              className="object-contain"
              priority
            />
          </div>
          <p className="text-gray-500 family-select-loading-text">Loading families...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white family-select-container">
      <div className="w-full max-w-md mx-auto p-6">
        <div className="text-center mt-2 mb-4">
          <h2 className="text-xl font-semibold family-select-title">Select Family</h2>
          <p className="text-sm text-gray-500 family-select-description">
            Choose your family to continue to login
          </p>
        </div>
        
        <div className="flex flex-col items-center space-y-6 pb-6 pl-6 pr-6">
          <div className="w-24 h-24 p-1 flex items-center justify-center">
            <Image
              src="/sprout-128.png"
              alt="Sprout Logo"
              width={128}
              height={128}
              className="object-contain"
              priority
            />
          </div>
          
          <div className="w-full max-w-[320px] space-y-6">
            {/* Family Search Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 text-teal-600 mb-4">
                <Users className="w-5 h-5 family-select-section-icon" />
                <span className="text-lg font-semibold family-select-section-title">Family Selection</span>
              </div>
              
              {/* Search Input */}
              <div className="relative">
                <div className="relative w-full">
                  <div className="flex items-center w-full">
                    <div className="absolute left-3 z-10">
                      <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </div>
                    <Input
                      ref={inputRef}
                      value={searchTerm}
                      onChange={handleSearchChange}
                      onFocus={handleSearchFocus}
                      onKeyDown={handleKeyDown}
                      className="w-full pl-10 pr-10 family-select-input"
                      placeholder="Search for your family..."
                      disabled={loading}
                    />
                    <ChevronDown 
                      className="absolute right-3 h-4 w-4 text-gray-500 dark:text-gray-400 family-select-dropdown-icon"
                      onClick={() => {
                        setDropdownOpen(!dropdownOpen);
                        if (document.activeElement instanceof HTMLElement) {
                          document.activeElement.blur();
                        }
                      }}
                    />
                  </div>
                  
                  {dropdownOpen && (
                    <div 
                      ref={dropdownRef}
                      className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto family-select-dropdown"
                      style={{ width: inputRef.current?.offsetWidth }}
                    >
                      {filteredFamilies.length > 0 ? (
                        <div className="py-1">
                          {filteredFamilies.map((family, index) => (
                            <div 
                              key={family.id}
                              className={`px-4 py-3 cursor-pointer family-select-dropdown-item ${
                                highlightedIndex === index 
                                  ? 'bg-teal-50 dark:bg-teal-900/20' 
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                              onClick={() => handleFamilySelect(family)}
                              onMouseEnter={() => setHighlightedIndex(index)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 dark:text-gray-100">
                                    {family.name}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    /{family.slug}
                                  </div>
                                </div>
                                <Users className="w-4 h-4 text-gray-400" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {searchTerm.trim() !== '' ? 'No families found' : 'No families available'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Selected Family Display */}
            {selectedFamily && (
              <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4 border border-teal-200 dark:border-teal-800 family-select-selected-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-teal-100 dark:bg-teal-800 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100 family-select-selected-family-name">
                        {selectedFamily.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 family-select-selected-family-slug">
                        /{selectedFamily.slug}
                      </div>
                    </div>
                  </div>
                  <div className="text-teal-600 dark:text-teal-400 family-select-selected-label">
                    Selected
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="w-full max-w-[320px]">
            <Button
              onClick={handleProceed}
              disabled={!selectedFamily}
              className="w-full h-12 text-base font-semibold bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center space-x-2">
                <span>Continue to Login</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 