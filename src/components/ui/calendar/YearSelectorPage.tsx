'use client';

import React from 'react';
import { cn } from '@/src/lib/utils';

interface YearSelectorPageProps {
  currentYear: number;
  variant?: 'default' | 'compact' | 'date-time-picker';
  onYearSelect: (year: number) => void;
  minYear?: number;
  maxYear?: number;
  decadeStart?: number;
}

export function YearSelectorPage({
  currentYear,
  onYearSelect,
  maxYear = new Date().getFullYear(),
  decadeStart
}: YearSelectorPageProps) {
  const currentDecadeStart = decadeStart || Math.floor(currentYear / 12) * 12;

  const handleYearClick = (year: number) => {
    onYearSelect(year);
  };

  // Generate years for current page
  const years = [];
  for (let i = 0; i < 12; i++) {
    const year = currentDecadeStart + i;
    if (year <= maxYear) {
      years.push(year);
    }
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-2">
        {years.map((year) => (
          <button
            key={year}
            type="button"
            onClick={() => handleYearClick(year)}
            className={cn(
              "h-12 w-full rounded-md text-sm font-medium transition-colors",
              "flex items-center justify-center",
              year === currentYear 
                ? "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200" 
                : "hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-900 dark:hover:text-teal-200 text-gray-700 dark:text-gray-300"
            )}
          >
            {year}
          </button>
        ))}
      </div>
    </div>
  );
}