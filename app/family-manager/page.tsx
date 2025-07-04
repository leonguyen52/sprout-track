'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardContent } from "@/src/components/ui/card";
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
  XCircle
} from "lucide-react";
import { useRouter } from 'next/navigation';
import FamilyForm from '@/src/components/forms/FamilyForm';
import AppConfigForm from '@/src/components/forms/AppConfigForm';
import { ShareButton } from '@/src/components/ui/share-button';

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

export default function FamilyManagerPage() {
  const router = useRouter();
  const [families, setFamilies] = useState<FamilyData[]>([]);
  const [invites, setInvites] = useState<FamilySetupInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<FamilyData>>({});
  const [saving, setSaving] = useState(false);
  const [caretakersDialogOpen, setCaretakersDialogOpen] = useState(false);
  const [selectedFamilyCaretakers, setSelectedFamilyCaretakers] = useState<CaretakerData[]>([]);
  const [loadingCaretakers, setLoadingCaretakers] = useState(false);
  const [slugError, setSlugError] = useState<string>('');
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<FamilyData | null>(null);
  const [isEditingFamily, setIsEditingFamily] = useState(false);
  const [showAppConfigForm, setShowAppConfigForm] = useState(false);
  const [appConfig, setAppConfig] = useState<{ rootDomain: string; enableHttps: boolean } | null>(null);
  const [deletingInviteId, setDeletingInviteId] = useState<string | null>(null);

  // Tab and table state
  const [activeTab, setActiveTab] = useState('families');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Define tabs with counts
  const tabs = useMemo(() => [
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
  ], [families.length, invites]);

  // Get current data based on active tab
  const currentData = useMemo(() => {
    return activeTab === 'families' ? families : invites;
  }, [activeTab, families, invites]);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return currentData;
    
    const search = searchTerm.toLowerCase();
    
    if (activeTab === 'families') {
      return (currentData as FamilyData[]).filter(family =>
        family.name.toLowerCase().includes(search) ||
        family.slug.toLowerCase().includes(search)
      );
    } else {
      return (currentData as FamilySetupInvite[]).filter(invite =>
        invite.token.toLowerCase().includes(search) ||
        invite.creator?.name.toLowerCase().includes(search) ||
        invite.family?.name.toLowerCase().includes(search)
      );
    }
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
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchFamilies(),
        fetchInvites(),
        fetchAppConfig()
      ]);
      setLoading(false);
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Card className="h-full w-full rounded-none border-0">
        <CardHeader>
          <div className="flex justify-between items-center">
            <Button onClick={handleAddFamily}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Family
            </Button>
            <Button variant="outline" onClick={() => setShowAppConfigForm(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
            placeholder={activeTab === 'families' ? "Search families by name or slug..." : "Search invites by token, creator, or family..."}
          />

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                {activeTab === 'families' ? (
                  <>
                    <TableHead>Family Name</TableHead>
                    <TableHead>Link/Slug</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Babies</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>Token</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Family</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeTab === 'families' ? 8 : 7} className="text-center py-8 text-gray-500">
                    {searchTerm ? `No ${activeTab} found matching your search.` : `No ${activeTab} found.`}
                  </TableCell>
                </TableRow>
              ) : activeTab === 'families' ? (
                (paginatedData as FamilyData[]).map((family) => {
                  const isEditing = editingId === family.id;
                  
                  return (
                    <TableRow key={family.id}>
                      <TableCell className="font-medium">
                        {isEditing ? (
                          <Input
                            value={editingData.name || ''}
                            onChange={(e) => setEditingData(prev => ({ ...prev, name: e.target.value }))}
                            className="min-w-[200px]"
                          />
                        ) : (
                          family.name
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {isEditing ? (
                          <div className="space-y-1">
                            <div className="relative">
                              <Input
                                value={editingData.slug || ''}
                                onChange={(e) => setEditingData(prev => ({ ...prev, slug: e.target.value }))}
                                className={`min-w-[150px] ${slugError ? 'border-red-500' : ''}`}
                              />
                              {checkingSlug && (
                                <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                              )}
                            </div>
                            {slugError && (
                              <div className="flex items-center gap-1 text-red-600 text-xs">
                                <AlertCircle className="h-3 w-3" />
                                {slugError}
                              </div>
                            )}
                          </div>
                        ) : (
                          family.slug
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{formatDateTime(family.createdAt)}</TableCell>
                      <TableCell className="text-sm">{formatDateTime(family.updatedAt)}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={editingData.isActive !== undefined ? editingData.isActive : family.isActive}
                              onCheckedChange={(checked) => setEditingData(prev => ({ ...prev, isActive: !!checked }))}
                            />
                            <label className="text-sm">Active</label>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              family.isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                            }`}
                          >
                            {family.isActive ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{family.caretakerCount || 0}</TableCell>
                      <TableCell>{family.babyCount || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => saveFamily(family)}
                                disabled={saving || !!slugError || checkingSlug}
                              >
                                {saving ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancelEdit}
                                disabled={saving}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(family)}
                                title="Edit family"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewCaretakers(family)}
                                title="View caretakers"
                              >
                                <Users className="h-4 w-4" />
                              </Button>
                              <ShareButton
                                familySlug={family.slug}
                                familyName={family.name}
                                appConfig={appConfig || undefined}
                                variant="outline"
                                size="sm"
                                showText={false}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleLogin(family)}
                                title="Login to family"
                              >
                                <LogIn className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                (paginatedData as FamilySetupInvite[]).map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-mono text-sm">
                      {invite.token.substring(0, 16)}...
                    </TableCell>
                    <TableCell>
                      {invite.creator ? (
                        <div>
                          <div className="font-medium">{invite.creator.name}</div>
                          <div className="text-xs text-gray-500">ID: {invite.creator.loginId}</div>
                        </div>
                      ) : (
                        'Unknown'
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{formatDateTime(invite.createdAt)}</TableCell>
                    <TableCell className="text-sm">{formatDateTime(invite.expiresAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {invite.isUsed ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Used
                          </span>
                        ) : invite.isExpired ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            <XCircle className="h-3 w-3 mr-1" />
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <Clock className="h-3 w-3 mr-1" />
                            Active
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {invite.family ? (
                        <div>
                          <div className="font-medium">{invite.family.name}</div>
                          <div className="text-xs text-gray-500">/{invite.family.slug}</div>
                        </div>
                      ) : (
                        'Not created yet'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!invite.isUsed && (
                          <>
                            <ShareButton
                              familySlug={`setup/${invite.token}`}
                              familyName="Family Setup Invitation"
                              appConfig={appConfig || undefined}
                              variant="outline"
                              size="sm"
                              showText={false}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteInvite(invite.id)}
                              disabled={deletingInviteId === invite.id}
                              title="Revoke invite"
                            >
                              {deletingInviteId === invite.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

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
        </CardContent>
      </Card>

      {/* Caretakers Dialog */}
      <Dialog open={caretakersDialogOpen} onOpenChange={setCaretakersDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Family Caretakers</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {loadingCaretakers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : selectedFamilyCaretakers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Login ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedFamilyCaretakers.map((caretaker) => (
                    <TableRow key={caretaker.id}>
                      <TableCell className="font-mono">{caretaker.loginId}</TableCell>
                      <TableCell>{caretaker.name}</TableCell>
                      <TableCell>{caretaker.type || 'N/A'}</TableCell>
                      <TableCell>{caretaker.role}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            !caretaker.inactive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {!caretaker.inactive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-8 text-gray-500">No caretakers found for this family.</p>
            )}
          </div>
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