'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSearch,
  TableTabs,
  TablePagination,
  TablePageSize,
} from "@/src/components/ui/table";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { 
  Edit, 
  Users, 
  LogIn, 
  Check, 
  X, 
  Plus,
  Loader2,
  AlertCircle,
  Settings,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  UserX,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from 'next/navigation';
import FamilyForm from '@/src/components/forms/FamilyForm';
import AppConfigForm from '@/src/components/forms/AppConfigForm';
import { ShareButton } from '@/src/components/ui/share-button';
import { BetaSubscriberResponse, FeedbackResponse } from '@/app/api/types';
import { useDeployment } from '@/app/context/deployment';
import { 
  FamilyView, 
  ActiveInviteView, 
  AccountView, 
  BetaSubscriberView,
  FeedbackView 
} from '@/src/components/familymanager';

// Types for our family data
interface FamilyData {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  caretakerCount?: number;
  babyCount?: number;
}

interface CaretakerData {
  id: string;
  loginId: string;
  name: string;
  type: string | null;
  role: string;
  inactive: boolean;
}

interface FamilySetupInvite {
  id: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  isExpired: boolean;
  isUsed: boolean;
  familyId: string | null;
  createdBy: string;
  creator: {
    id: string;
    name: string;
    loginId: string;
  } | null;
  family: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface AccountData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  verified: boolean;
  betaparticipant: boolean;
  closed: boolean;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  familyId: string | null;
  family: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export default function FamilyManagerPage() {
  const router = useRouter();
  const { isSaasMode } = useDeployment();
  const [families, setFamilies] = useState<FamilyData[]>([]);
  const [invites, setInvites] = useState<FamilySetupInvite[]>([]);
  const [betaSubscribers, setBetaSubscribers] = useState<BetaSubscriberResponse[]>([]);
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [feedback, setFeedback] = useState<FeedbackResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<FamilyData>>({});
  const [saving, setSaving] = useState(false);
  const [caretakersDialogOpen, setCaretakersDialogOpen] = useState(false);
  const [selectedFamilyCaretakers, setSelectedFamilyCaretakers] = useState<CaretakerData[]>([]);
  const [loadingCaretakers, setLoadingCaretakers] = useState(false);
  const [selectedFamilyForCaretakers, setSelectedFamilyForCaretakers] = useState<FamilyData | null>(null);
  const [editingCaretaker, setEditingCaretaker] = useState<CaretakerData | null>(null);
  const [caretakerModalOpen, setCaretakerModalOpen] = useState(false);
  const [deletingCaretakerId, setDeletingCaretakerId] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string>('');
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<FamilyData | null>(null);
  const [isEditingFamily, setIsEditingFamily] = useState(false);
  const [showAppConfigForm, setShowAppConfigForm] = useState(false);
  const [appConfig, setAppConfig] = useState<{ rootDomain: string; enableHttps: boolean } | null>(null);
  const [deletingInviteId, setDeletingInviteId] = useState<string | null>(null);
  const [deletingSubscriberId, setDeletingSubscriberId] = useState<string | null>(null);
  const [updatingSubscriberId, setUpdatingSubscriberId] = useState<string | null>(null);
  const [updatingAccountId, setUpdatingAccountId] = useState<string | null>(null);
  const [updatingFeedbackId, setUpdatingFeedbackId] = useState<string | null>(null);

  // Tab and table state
  const [activeTab, setActiveTab] = useState('families');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Define tabs with counts
  const tabs = useMemo(() => {
    const baseTabs = [
        { 
            id: 'families', 
            label: 'Families',
            count: families.length 
        },
        { 
            id: 'invites', 
            label: 'Active Invites',
            count: invites.filter(invite => !invite.isExpired && !invite.isUsed).length 
        },
    ];

    if (isSaasMode) {
        return [
            ...baseTabs,
            {
              id: 'accounts',
              label: 'Accounts',
              count: accounts.length,
            },
            {
              id: 'beta',
              label: 'Beta Subscribers',
              count: betaSubscribers.length,
            },
            {
              id: 'feedback',
              label: 'Feedback',
              count: feedback.filter(item => !item.viewed).length,
            }
        ];
    }

    return baseTabs;
  }, [families.length, invites, accounts.length, betaSubscribers.length, feedback, isSaasMode]);

  // Get current data based on active tab
  const currentData = useMemo(() => {
    if (activeTab === 'families') return families;
    if (activeTab === 'invites') return invites;
    if (activeTab === 'accounts') return accounts;
    if (activeTab === 'beta') return betaSubscribers;
    if (activeTab === 'feedback') return feedback;
    return [];
  }, [activeTab, families, invites, accounts, betaSubscribers, feedback]);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return currentData;
    
    const search = searchTerm.toLowerCase();
    
    if (activeTab === 'families') {
      return (currentData as FamilyData[]).filter(family =>
        family.name.toLowerCase().includes(search) ||
        family.slug.toLowerCase().includes(search)
      );
    } else if (activeTab === 'invites') {
      return (currentData as FamilySetupInvite[]).filter(invite =>
        invite.token.toLowerCase().includes(search) ||
        invite.creator?.name.toLowerCase().includes(search) ||
        invite.family?.name.toLowerCase().includes(search)
      );
    } else if (activeTab === 'accounts') {
        return (currentData as AccountData[]).filter(
          (account) =>
            account.email.toLowerCase().includes(search) ||
            account.firstName?.toLowerCase().includes(search) ||
            account.lastName?.toLowerCase().includes(search) ||
            account.family?.name.toLowerCase().includes(search)
        );
    } else if (activeTab === 'beta') {
        return (currentData as BetaSubscriberResponse[]).filter(
          (subscriber) =>
            subscriber.email.toLowerCase().includes(search) ||
            subscriber.firstName?.toLowerCase().includes(search) ||
            subscriber.lastName?.toLowerCase().includes(search)
        );
    } else if (activeTab === 'feedback') {
        return (currentData as FeedbackResponse[]).filter(
          (item) =>
            item.subject.toLowerCase().includes(search) ||
            item.message.toLowerCase().includes(search) ||
            item.submitterName?.toLowerCase().includes(search) ||
            item.submitterEmail?.toLowerCase().includes(search)
        );
    }
    return [];
  }, [currentData, searchTerm, activeTab]);

  // Calculate pagination
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  // Reset to first page when search term, tab, or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, pageSize]);

  // Fetch app config data
  const fetchAppConfig = async () => {
    try {
      const response = await fetch('/api/app-config/public');
      const data = await response.json();
      
      if (data.success) {
        setAppConfig(data.data);
      } else {
        console.error('Failed to fetch app config:', data.error);
      }
    } catch (error) {
      console.error('Error fetching app config:', error);
    }
  };

  // Fetch families data
  const fetchFamilies = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch('/api/family/manage', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setFamilies(data.data);
      } else {
        console.error('Failed to fetch families:', data.error);
      }
    } catch (error) {
      console.error('Error fetching families:', error);
    }
  };

  // Fetch invites data
  const fetchInvites = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch('/api/family/setup-invites', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setInvites(data.data);
      } else {
        console.error('Failed to fetch invites:', data.error);
      }
    } catch (error) {
      console.error('Error fetching invites:', error);
    }
  };

    // Fetch beta subscribers data
    const fetchBetaSubscribers = async () => {
        try {
          const authToken = localStorage.getItem('authToken');
          const response = await fetch('/api/beta-subscribers', {
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          });
          const data = await response.json();
          if (data.success) {
            setBetaSubscribers(data.data);
          } else {
            console.error('Failed to fetch beta subscribers:', data.error);
          }
        } catch (error) {
          console.error('Error fetching beta subscribers:', error);
        }
      };

  // Fetch feedback data
  const fetchFeedback = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch('/api/feedback', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setFeedback(data.data);
      } else {
        console.error('Failed to fetch feedback:', data.error);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

  // Check slug uniqueness
  const checkSlugUniqueness = useCallback(async (slug: string, currentFamilyId: string) => {
    if (!slug || slug.trim() === '') {
      setSlugError('');
      return;
    }

    setCheckingSlug(true);
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`/api/family/by-slug/${encodeURIComponent(slug)}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      
      if (data.success && data.data && data.data.id !== currentFamilyId) {
        setSlugError('This slug is already taken');
      } else {
        setSlugError('');
      }
    } catch (error) {
      console.error('Error checking slug:', error);
      setSlugError('Error checking slug availability');
    } finally {
      setCheckingSlug(false);
    }
  }, []);

  // Debounced slug check
  useEffect(() => {
    if (editingData.slug && editingId) {
      const timeoutId = setTimeout(() => {
        checkSlugUniqueness(editingData.slug!, editingId);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [editingData.slug, editingId, checkSlugUniqueness]);

  // Fetch caretakers for a family
  const fetchCaretakers = async (familyId: string) => {
    try {
      setLoadingCaretakers(true);
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`/api/family/${familyId}/caretakers`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setSelectedFamilyCaretakers(data.data);
      } else {
        console.error('Failed to fetch caretakers:', data.error);
        setSelectedFamilyCaretakers([]);
      }
    } catch (error) {
      console.error('Error fetching caretakers:', error);
      setSelectedFamilyCaretakers([]);
    } finally {
      setLoadingCaretakers(false);
    }
  };

  // Delete/revoke invite
  const deleteInvite = async (inviteId: string) => {
    try {
      setDeletingInviteId(inviteId);
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`/api/family/setup-invites?id=${inviteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchInvites(); // Refresh the invites list
      } else {
        console.error('Failed to delete invite:', data.error);
        alert('Failed to delete invite: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting invite:', error);
      alert('Error deleting invite');
    } finally {
      setDeletingInviteId(null);
    }
  };

  // Save family changes
  const saveFamily = async (family: FamilyData) => {
    // Don't save if there's a slug error
    if (slugError) {
      alert('Please fix the slug error before saving');
      return;
    }

    try {
      setSaving(true);
      const authToken = localStorage.getItem('authToken');
      const response = await fetch('/api/family/manage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          id: family.id,
          name: editingData.name || family.name,
          slug: editingData.slug || family.slug,
          isActive: editingData.isActive !== undefined ? editingData.isActive : family.isActive,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchFamilies(); // Refresh the list
        setEditingId(null);
        setEditingData({});
        setSlugError('');
      } else {
        console.error('Failed to save family:', data.error);
        alert('Failed to save changes: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving family:', error);
      alert('Error saving changes');
    } finally {
      setSaving(false);
    }
  };

    // Update subscriber opt-in status
    const updateSubscriber = async (id: string, isOptedIn: boolean) => {
        try {
          setUpdatingSubscriberId(id);
          const authToken = localStorage.getItem('authToken');
          const response = await fetch(`/api/beta-subscribers?id=${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ isOptedIn }),
          });
    
          const data = await response.json();
    
          if (data.success) {
            fetchBetaSubscribers();
          } else {
            console.error('Failed to update subscriber:', data.error);
            alert('Failed to update subscriber: ' + data.error);
          }
        } catch (error) {
          console.error('Error updating subscriber:', error);
          alert('Error updating subscriber');
        } finally {
          setUpdatingSubscriberId(null);
        }
      };

        // Delete subscriber
  const deleteSubscriber = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subscriber? This action is permanent.')) {
        return;
      }
    try {
      setDeletingSubscriberId(id);
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`/api/beta-subscribers?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        fetchBetaSubscribers();
      } else {
        console.error('Failed to delete subscriber:', data.error);
        alert('Failed to delete subscriber: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      alert('Error deleting subscriber');
    } finally {
      setDeletingSubscriberId(null);
    }
  };

  // Handle edit button click
  const handleEdit = (family: FamilyData) => {
    setEditingId(family.id);
    setEditingData({
      name: family.name,
      slug: family.slug,
      isActive: family.isActive,
    });
    setSlugError('');
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData({});
    setSlugError('');
  };

  // Handle view caretakers
  const handleViewCaretakers = async (family: FamilyData) => {
    setSelectedFamilyForCaretakers(family);
    setCaretakersDialogOpen(true);
    await fetchCaretakers(family.id);
  };

  // Handle login navigation
  const handleLogin = (family: FamilyData) => {
    router.push(`/${family.slug}/login`);
  };

  // Handle add new family
  const handleAddFamily = () => {
    setSelectedFamily(null);
    setIsEditingFamily(false);
    setShowFamilyForm(true);
  };

  // Handle family form close
  const handleFamilyFormClose = () => {
    setShowFamilyForm(false);
    setSelectedFamily(null);
    setIsEditingFamily(false);
  };

  // Handle family form success
  const handleFamilyFormSuccess = () => {
    fetchFamilies(); // Refresh the families list
    fetchInvites(); // Refresh the invites list in case a new invite was created
  };

  // Format date/time for display
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Fetch accounts data
  const fetchAccounts = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch('/api/accounts/manage', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setAccounts(data.data);
      } else {
        console.error('Failed to fetch accounts:', data.error);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  // Update account status (close/reinstate)
  const updateAccount = async (id: string, closed: boolean) => {
    try {
      setUpdatingAccountId(id);
      const authToken = localStorage.getItem('authToken');
      const response = await fetch('/api/accounts/manage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ id, closed }),
      });

      const data = await response.json();

      if (data.success) {
        fetchAccounts();
      } else {
        console.error('Failed to update account:', data.error);
        alert('Failed to update account: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating account:', error);
      alert('Error updating account');
    } finally {
      setUpdatingAccountId(null);
    }
  };

  // Update feedback status (mark as read/unread)
  const updateFeedback = async (id: string, viewed: boolean) => {
    try {
      setUpdatingFeedbackId(id);
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`/api/feedback?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ viewed }),
      });

      const data = await response.json();

      if (data.success) {
        fetchFeedback();
      } else {
        console.error('Failed to update feedback:', data.error);
        alert('Failed to update feedback: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating feedback:', error);
      alert('Error updating feedback');
    } finally {
      setUpdatingFeedbackId(null);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const dataPromises = [
        fetchFamilies(),
        fetchInvites(),
        fetchAppConfig(),
      ];

      if (isSaasMode) {
        dataPromises.push(fetchBetaSubscribers());
        dataPromises.push(fetchAccounts());
        dataPromises.push(fetchFeedback());
      }
      
      await Promise.all(dataPromises);

      setLoading(false);
    };
    
    fetchData();
  }, [isSaasMode]);

  const emptyMessageNoun = useMemo(() => {
    switch(activeTab) {
        case 'families': return 'families';
        case 'invites': return 'invites';
        case 'accounts': return 'accounts';
        case 'beta': return 'data';
        case 'feedback': return 'feedback';
        default: return 'data';
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full w-full p-6">
      <div className="flex justify-between items-center mb-6">
        <Button onClick={handleAddFamily}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Family
        </Button>
        <Button variant="outline" onClick={() => setShowAppConfigForm(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      <div className="space-y-6">
        {/* Tabs */}
        <TableTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Search */}
        <TableSearch
          value={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder={
            activeTab === 'families' ? "Search families by name or slug..." :
            activeTab === 'invites' ? "Search invites by token, creator, or family..." :
            activeTab === 'accounts' ? "Search accounts by email, name, or family..." :
            activeTab === 'feedback' ? "Search feedback by subject, message, or submitter..." :
            "Search subscribers by email or name..."
          }
        />

        {/* Render appropriate view component based on active tab */}
        {activeTab === 'families' && (
          <FamilyView
            families={families}
            paginatedData={paginatedData as FamilyData[]}
            onEdit={handleEdit}
            onViewCaretakers={handleViewCaretakers}
            onLogin={handleLogin}
            onSave={saveFamily}
            onCancelEdit={handleCancelEdit}
            editingId={editingId}
            editingData={editingData}
            setEditingData={setEditingData}
            saving={saving}
            slugError={slugError}
            checkingSlug={checkingSlug}
            appConfig={appConfig}
            formatDateTime={formatDateTime}
          />
        )}

        {activeTab === 'invites' && (
          <ActiveInviteView
            paginatedData={paginatedData as FamilySetupInvite[]}
            onDeleteInvite={deleteInvite}
            deletingInviteId={deletingInviteId}
            appConfig={appConfig}
            formatDateTime={formatDateTime}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountView
            paginatedData={paginatedData as AccountData[]}
            onUpdateAccount={updateAccount}
            updatingAccountId={updatingAccountId}
            formatDateTime={formatDateTime}
          />
        )}

        {activeTab === 'beta' && (
          <BetaSubscriberView
            paginatedData={paginatedData as BetaSubscriberResponse[]}
            onUpdateSubscriber={updateSubscriber}
            onDeleteSubscriber={deleteSubscriber}
            updatingSubscriberId={updatingSubscriberId}
            deletingSubscriberId={deletingSubscriberId}
            formatDateTime={formatDateTime}
          />
        )}

        {activeTab === 'feedback' && (
          <FeedbackView
            paginatedData={paginatedData as FeedbackResponse[]}
            onUpdateFeedback={updateFeedback}
            updatingFeedbackId={updatingFeedbackId}
            formatDateTime={formatDateTime}
          />
        )}

        {/* Empty state for when no data matches search */}
        {paginatedData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? `No ${emptyMessageNoun} found matching your search.` : `No ${emptyMessageNoun} found.`}
          </div>
        )}

        {/* Pagination and Page Size Controls */}
        {totalItems >= 10 && (
          <div className="flex items-center justify-between">
            <TablePageSize
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
            />
            
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Caretakers Dialog */}
      <Dialog open={caretakersDialogOpen} onOpenChange={(open) => { setCaretakersDialogOpen(open); if (!open) { setSelectedFamilyForCaretakers(null); } }}>
        <DialogContent className="w-[90vw] max-w-[1400px]">
          <DialogHeader>
            <DialogTitle>Family Caretakers</DialogTitle>
          </DialogHeader>
          <div className="mt-4 max-h-[70vh] overflow-auto">
            {loadingCaretakers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : selectedFamilyCaretakers.length > 0 ? (
              <div>
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Login</TableHead>
                      <TableHead className="w-[220px]">Name</TableHead>
                      <TableHead className="w-[160px]">Type</TableHead>
                      <TableHead className="w-20">Role</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedFamilyCaretakers.map((caretaker) => (
                      <TableRow key={caretaker.id}>
                        <TableCell className="font-mono text-sm whitespace-nowrap">{caretaker.loginId}</TableCell>
                        <TableCell className="font-medium max-w-[220px] truncate">{caretaker.name}</TableCell>
                        <TableCell className="text-sm max-w-[160px] truncate">{caretaker.type || 'N/A'}</TableCell>
                        <TableCell className="text-sm">{caretaker.role}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              !caretaker.inactive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {!caretaker.inactive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => { setEditingCaretaker(caretaker); setCaretakerModalOpen(true); }}
                              className="h-8 w-8 p-0"
                              title="Edit caretaker"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                if (!selectedFamilyForCaretakers) return;
                                if (!window.confirm('Delete this caretaker?')) return;
                                try {
                                  setDeletingCaretakerId(caretaker.id);
                                  const authToken = localStorage.getItem('authToken');
                                  const resp = await fetch(`/api/caretaker?id=${encodeURIComponent(caretaker.id)}&familyId=${encodeURIComponent(selectedFamilyForCaretakers.id)}`, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': `Bearer ${authToken}` },
                                  });
                                  const data = await resp.json();
                                  if (!data.success) throw new Error(data.error || 'Failed to delete caretaker');
                                  await fetchCaretakers(selectedFamilyForCaretakers.id);
                                } catch (e) {
                                  console.error('Failed to delete caretaker', e);
                                  alert('Failed to delete caretaker');
                                } finally {
                                  setDeletingCaretakerId(null);
                                }
                              }}
                              disabled={deletingCaretakerId === caretaker.id}
                              className="h-8 w-8 p-0"
                              title="Delete caretaker"
                            >
                              {deletingCaretakerId === caretaker.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">No caretakers found for this family.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Caretaker Modal */}
      <Dialog open={caretakerModalOpen} onOpenChange={(open) => { setCaretakerModalOpen(open); if (!open) setEditingCaretaker(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Caretaker</DialogTitle>
          </DialogHeader>
          {editingCaretaker && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={editingCaretaker.name}
                  onChange={(e) => setEditingCaretaker({ ...editingCaretaker, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Input
                  value={editingCaretaker.type || ''}
                  onChange={(e) => setEditingCaretaker({ ...editingCaretaker, type: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={!editingCaretaker.inactive}
                  onCheckedChange={(checked) => setEditingCaretaker({ ...editingCaretaker, inactive: !checked })}
                />
                <span className="text-sm">Active</span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setCaretakerModalOpen(false); setEditingCaretaker(null); }}>Cancel</Button>
                <Button
                  onClick={async () => {
                    if (!editingCaretaker || !selectedFamilyForCaretakers) return;
                    try {
                      const authToken = localStorage.getItem('authToken');
                      const response = await fetch(`/api/caretaker?familyId=${encodeURIComponent(selectedFamilyForCaretakers.id)}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${authToken}`,
                        },
                        body: JSON.stringify({ id: editingCaretaker.id, name: editingCaretaker.name, type: editingCaretaker.type, inactive: editingCaretaker.inactive }),
                      });
                      const data = await response.json();
                      if (!data.success) throw new Error(data.error || 'Failed to update caretaker');
                      await fetchCaretakers(selectedFamilyForCaretakers.id);
                      setCaretakerModalOpen(false);
                      setEditingCaretaker(null);
                    } catch (err) {
                      console.error('Failed to save caretaker', err);
                      alert('Failed to save caretaker');
                    }
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Family Form */}
      <FamilyForm
        isOpen={showFamilyForm}
        onClose={handleFamilyFormClose}
        isEditing={isEditingFamily}
        family={selectedFamily}
        onFamilyChange={handleFamilyFormSuccess}
      />

      {/* App Config Form */}
      <AppConfigForm
        isOpen={showAppConfigForm}
        onClose={() => setShowAppConfigForm(false)}
      />
    </div>
  );
}
