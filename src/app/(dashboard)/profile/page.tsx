'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/core/store/authStore';
import { LoadingSpinner } from '@/core/components/common/LoadingSpinner';
import { ProtectedPage } from '@/core/components/common/ProtectedPage';
import {
  ChangePasswordDialog,
  ProfileSidebar,
  ProfileTabs,
  SecurityTab,
  OverviewTab
} from '@/core/components/profile';

interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  isEmailVerified: boolean;
  tenantId: string | null;
  timezone?: string | null;
  locale?: string | null;
  phoneNumber?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  companyName?: string | null;
  dateOfBirth?: string | Date | null;
  bio?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  roles?: Array<{ id: string; name: string; code: string }>;
  permissions?: Array<{
    permissionCode: string;
    permissionName: string;
    moduleCode: string;
    moduleName: string;
  }>;
}

type TabType = 'overview' | 'security';

export default function ProfilePage() {
  const { user: storeUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch('/api/auth/profile');
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to load profile');
          return;
        }

        setProfile(data.user);
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError('An error occurred while loading your profile');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const handleProfileUpdated = (updatedProfile: {
    id: string;
    email: string;
    fullName: string | null;
    timezone?: string | null;
    locale?: string | null;
    phoneNumber?: string | null;
    jobTitle?: string | null;
    department?: string | null;
    companyName?: string | null;
    dateOfBirth?: string | Date | null;
    bio?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
  }) => {
    if (profile) {
      setProfile({
        ...profile,
        ...updatedProfile,
      });
    }
    setIsSavingProfile(false);
  };

  const handleProfileSavingChange = (saving: boolean) => {
    setIsSavingProfile(saving);
  };

  // Mock data for demonstration
  const stats = {
    posts: 184,
    projects: 32,
    members: 4500
  };

  return (
    <ProtectedPage
      permission="profile:read"
      title="Profile"
      description="Manage your profile settings"
      fallbackPath="/dashboard"
      showLoader={false}
    >
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">{error}</p>
        </div>
      ) : (
        <div className="min-h-screen bg-background">
          {/* Header */}
          <div className="bg-card border-b border-border">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <h1 className="text-2xl font-bold text-foreground">Profile Page</h1>
            </div>
            
            {/* Tabs */}
            <div className="px-4 sm:px-6 lg:px-8">
              <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
          </div>

          {/* Main Content */}
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Sidebar */}
              <div className="lg:col-span-4">
                <ProfileSidebar
                  profile={{
                    fullName: profile?.fullName || null,
                    email: profile?.email || storeUser?.email || '',
                    roles: profile?.roles
                  }}
                  stats={stats}
                />
              </div>

              {/* Right Content */}
              <div className="lg:col-span-8">
                {activeTab === 'overview' && profile && (
                  <OverviewTab
                    profile={profile}
                    onProfileUpdated={handleProfileUpdated}
                    onSavingChange={handleProfileSavingChange}
                    isSaving={isSavingProfile}
                    onChangePassword={() => setIsPasswordDialogOpen(true)}
                  />
                )}
                {activeTab === 'security' && (
                  <SecurityTab onChangePassword={() => setIsPasswordDialogOpen(true)} />
                )}
              </div>
            </div>
          </div>

          {/* Change Password Dialog */}
          <ChangePasswordDialog
            open={isPasswordDialogOpen}
            onOpenChange={setIsPasswordDialogOpen}
          />
        </div>
      )}
    </ProtectedPage>
  );
}
