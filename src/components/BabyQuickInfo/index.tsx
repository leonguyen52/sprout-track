'use client';

import React, { useState, useEffect } from 'react';
import { Baby } from '@prisma/client';
import FormPage, { FormPageContent, FormPageFooter } from '@/src/components/ui/form-page';
import { Button } from '@/src/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { styles } from './baby-quick-info.styles';
import { Tab, BabyQuickInfoProps } from './baby-quick-info.types';
import NotificationsTab from './NotificationsTab';
import ContactsTab from './ContactsTab';
import StatsTab from './StatsTab';
import './baby-quick-info.css';

/**
 * BabyQuickInfo Component
 * 
 * A tabbed component that displays information about a baby, including
 * notifications, contacts, and quick stats.
 * 
 * @example
 * ```tsx
 * <BabyQuickInfo
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   selectedBaby={selectedBaby}
 *   calculateAge={calculateAge}
 * />
 * ```
 */
const BabyQuickInfo: React.FC<BabyQuickInfoProps> = ({
  isOpen,
  onClose,
  selectedBaby,
  calculateAge
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('notifications');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [lastActivities, setLastActivities] = useState<any>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  
  // Fetch data when the component opens or the baby changes
  useEffect(() => {
    if (isOpen && selectedBaby) {
      fetchData();
    }
  }, [isOpen, selectedBaby]);
  
  // Fetch all necessary data
  const fetchData = async () => {
    if (!selectedBaby) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const authToken = localStorage.getItem('authToken');
      const fetchOptions = authToken ? {
        headers: { 'Authorization': `Bearer ${authToken}` }
      } : {};
      
      // Fetch data in parallel
      const [lastActivitiesRes, upcomingEventsRes, contactsRes, activitiesRes] = await Promise.all([
        fetch(`/api/baby-last-activities?babyId=${selectedBaby.id}`, fetchOptions),
        fetch(`/api/baby-upcoming-events?babyId=${selectedBaby.id}&limit=5`, fetchOptions),
        fetch(`/api/contact`, fetchOptions),
        fetch(`/api/timeline?babyId=${selectedBaby.id}&limit=30`, fetchOptions)
      ]);
      
      // Process responses
      if (lastActivitiesRes.ok) {
        const data = await lastActivitiesRes.json();
        setLastActivities(data.success ? data.data : null);
      } else {
        console.error('Failed to fetch last activities:', await lastActivitiesRes.text());
      }
      
      if (upcomingEventsRes.ok) {
        const data = await upcomingEventsRes.json();
        setUpcomingEvents(data.success ? data.data : []);
      } else {
        console.error('Failed to fetch upcoming events:', await upcomingEventsRes.text());
      }
      
      if (contactsRes.ok) {
        const data = await contactsRes.json();
        setContacts(data.success ? data.data : []);
      } else {
        console.error('Failed to fetch contacts:', await contactsRes.text());
      }
      
      if (activitiesRes.ok) {
        const data = await activitiesRes.json();
        setActivities(data.success ? data.data : []);
      } else {
        console.error('Failed to fetch activities:', await activitiesRes.text());
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <FormPage
      isOpen={isOpen}
      onClose={onClose}
      title={selectedBaby ? `${selectedBaby.firstName}'s Information` : 'Baby Information'}
    >
      <FormPageContent>
        {/* Tab navigation - always horizontal but left-aligned on larger screens */}
        <div className={cn(styles.tabContainer, "baby-quick-info-tab-container")}>
          <Button
            variant="ghost"
            onClick={() => setActiveTab('notifications')}
            className={cn(
              styles.tabButton, 
              "baby-quick-info-tab-button",
              activeTab === 'notifications' && styles.tabButtonActive,
              activeTab === 'notifications' && "baby-quick-info-tab-button-active"
            )}
          >
            Notifications
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab('contacts')}
            className={cn(
              styles.tabButton, 
              "baby-quick-info-tab-button",
              activeTab === 'contacts' && styles.tabButtonActive,
              activeTab === 'contacts' && "baby-quick-info-tab-button-active"
            )}
          >
            Contacts
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab('stats')}
            className={cn(
              styles.tabButton, 
              "baby-quick-info-tab-button",
              activeTab === 'stats' && styles.tabButtonActive,
              activeTab === 'stats' && "baby-quick-info-tab-button-active"
            )}
          >
            Quick Stats
          </Button>
        </div>
        
        <div className="flex-1">
          
          {/* Content area */}
          <div className="flex-1">
            {/* Loading state */}
            {isLoading && (
              <div className={cn(styles.loadingContainer, "baby-quick-info-loading-container")}>
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                <p className={cn("mt-2 text-gray-600", "baby-quick-info-loading-text")}>Loading...</p>
              </div>
            )}
            
            {/* Error state */}
            {error && (
              <div className={cn(styles.errorContainer, "baby-quick-info-error-container")}>
                <p className={cn("text-red-500", "baby-quick-info-error-text")}>{error}</p>
                <Button 
                  variant="outline" 
                  onClick={fetchData} 
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            )}
            
            {/* Tab content */}
            {!isLoading && !error && selectedBaby && (
              <div className={cn(styles.tabContent, "baby-quick-info-tab-content")}>
                {activeTab === 'notifications' && (
                  <NotificationsTab
                    lastActivities={lastActivities}
                    upcomingEvents={upcomingEvents}
                    selectedBaby={selectedBaby}
                  />
                )}
                
                {activeTab === 'contacts' && (
                  <ContactsTab
                    contacts={contacts}
                    selectedBaby={selectedBaby}
                  />
                )}
                
                {activeTab === 'stats' && (
                  <StatsTab
                    activities={activities}
                    selectedBaby={selectedBaby}
                    calculateAge={calculateAge}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </FormPageContent>
      
      <FormPageFooter>
        <div className={cn(styles.footerContainer, "baby-quick-info-footer-container")}>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </FormPageFooter>
    </FormPage>
  );
};

export default BabyQuickInfo;
