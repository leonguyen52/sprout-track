'use client';

import React from 'react';
import { cn } from '@/src/lib/utils';

interface MonthSelectorPageProps {
  currentMonth: number;
  currentYear: number;
  variant?: 'default' | 'compact' | 'date-time-picker';
  onMonthSelect: (month: number) => void;
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function MonthSelectorPage({
  currentMonth,
  currentYear,
  variant = 'default',
  onMonthSelect,
}: MonthSelectorPageProps) {
  const handleMonthClick = (monthIndex: number) => {
    onMonthSelect(monthIndex);
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-2">
        {monthNames.map((monthName, index) => (
          <button
            key={monthName}
            type="button"
            onClick={() => handleMonthClick(index)}
            className={cn(
              "h-12 w-full rounded-md text-sm font-medium transition-colors",
              "flex items-center justify-center",
              index === currentMonth 
                ? "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200" 
                : "hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-900 dark:hover:text-teal-200 text-gray-700 dark:text-gray-300"
            )}
          >
            {monthName}
          </button>
        ))}
      </div>
    </div>
  );
}