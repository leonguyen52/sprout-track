'use client';

import React, { useEffect } from 'react';
import { useBaby } from '../../../context/baby';
import { useTimezone } from '../../../context/timezone';
import { useFamily } from '@/src/context/family';
import { useParams } from 'next/navigation';
import { Calendar } from '@/src/components/Calendar';

function CalendarPage() {
  const { selectedBaby } = useBaby();
  const { userTimezone } = useTimezone();
  const { family } = useFamily();
  const params = useParams();
  const familySlug = params?.slug as string;

  // Update unlock timer on any activity
  const updateUnlockTimer = () => {
    const unlockTime = localStorage.getItem('unlockTime');
    if (unlockTime) {
      localStorage.setItem('unlockTime', Date.now().toString());
    }
  };

  // Add activity tracking
  useEffect(() => {
    // Add listeners for user activity
    window.addEventListener('click', updateUnlockTimer);
    window.addEventListener('keydown', updateUnlockTimer);
    window.addEventListener('mousemove', updateUnlockTimer);
    window.addEventListener('touchstart', updateUnlockTimer);

    return () => {
      // Clean up event listeners
      window.removeEventListener('click', updateUnlockTimer);
      window.removeEventListener('keydown', updateUnlockTimer);
      window.removeEventListener('mousemove', updateUnlockTimer);
      window.removeEventListener('touchstart', updateUnlockTimer);
    };
  }, []);

  return (
    <div className="h-full relative isolate overflow-hidden">
      {selectedBaby ? (
        <Calendar 
          selectedBabyId={selectedBaby.id} 
          userTimezone={userTimezone}
          // Note: If the Calendar component needs to be updated to support familyId,
          // we would need to modify the Calendar component itself
        />
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">No Baby Selected</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Please select a baby from the dropdown menu above.</p>
        </div>
      )}
    </div>
  );
}

export default CalendarPage;
