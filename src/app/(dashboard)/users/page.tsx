'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserList } from '@/core/components/users/UserList';
import { UserForm } from '@/core/components/users/UserForm';
import { FormDialog } from '@/core/components/common/FormDialog';
import { Card, CardContent } from '@/core/components/ui/card';
import { PageHeader } from '@/core/components/common/PageHeader';
import { ProtectedPage } from '@/core/components/common/ProtectedPage';
import { usePermissionProps } from '@/core/components/common/PermissionGate';
import { useAuthStore } from '@/core/store/authStore';
import { type CreateUserInput, type UpdateUserInput } from '@/core/lib/validations/users';
import type { User } from '@/core/lib/db/baseSchema';
import { toast } from 'sonner';

function UsersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user: currentUser } = useAuthStore();
  const { canCreate, canUpdate, canDelete } = usePermissionProps('users');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  // Derive current action from URL so we can keep dialog labels stable
  const action = searchParams.get('action');
  const isCreateMode = action === 'create';
  const isEditMode = action === 'edit';

  // Fetch roles for the form
  useEffect(() => {
    if (!token) return;

    async function fetchRoles() {
      try {
        const response = await fetch('/api/roles', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setRoles(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch roles:', error);
      }
    }

    fetchRoles();
  }, [token]);

  // Handle URL-based navigation
  useEffect(() => {
    const userId = searchParams.get('userId');

    if (!token) return;

    if (isCreateMode) {
      setShowForm(true);
      setEditingUser(null);
      setIsLoadingUser(false);
    } else if (isEditMode && userId) {
      setShowForm(true);
      setIsLoadingUser(true);
      // Fetch user details for editing
      fetch(`/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            const userWithRoleId = {
              ...data.data,
              roleId: data.data.roles?.[0]?.id || undefined,
            };
            setEditingUser(userWithRoleId);
          } else {
            toast.error('Failed to load user details');
            router.push('/users');
          }
        })
        .catch(err => {
          console.error('Failed to load user:', err);
          toast.error('Failed to load user details');
          router.push('/users');
        })
        .finally(() => setIsLoadingUser(false));
    } else if (!action || (action !== 'create' && action !== 'edit')) {
      // No action in URL, show list
      setShowForm(false);
      setEditingUser(null);
      setIsLoadingUser(false);
    }
  }, [searchParams, token, router, isCreateMode, isEditMode, action]);

  const handleCreate = async (data: CreateUserInput | UpdateUserInput) => {
    if (!token) {
      toast.error('You must be logged in to create users');
      return;
    }
    
    // Check permission before submitting
    if (editingUser && !canUpdate) {
      toast.error('You do not have permission to update users');
      return;
    }
    
    if (!editingUser && !canCreate) {
      toast.error('You do not have permission to create users');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PATCH' : 'POST';

      console.log('[User Form Submit]', { method, url, data });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save user');
      }

      toast.success(editingUser ? 'User updated successfully' : 'User created successfully');
      // Navigate back to list
      router.push('/users');
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user: User) => {
    if (!canUpdate) {
      toast.error('You do not have permission to update users');
      return;
    }
    
    router.push(`/users?action=edit&userId=${user.id}`);
  };

  const handleCancel = () => {
    router.push('/users');
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open && !isSubmitting) {
      router.push('/users');
    }
  };

  return (
    <ProtectedPage
      permission="users:read"
      title="User Management"
      description="Manage users"
    >
      <div className="w-full">
        <PageHeader
          title="User Management"
          description="Manage users"
        />
        <UserList
          onCreateClick={canCreate ? () => router.push('/users?action=create') : undefined}
          onEditClick={canUpdate ? handleEdit : undefined}
          onDeleteClick={canDelete ? (user: User) => user : undefined}
          refreshTrigger={refreshTrigger}
        />

        {/* Form Dialog */}
        <FormDialog
          open={showForm}
          onOpenChange={handleCloseDialog}
          title={isEditMode ? 'Edit User' : 'Create New User'}
          description={isEditMode ? 'Update user information and permissions' : 'Add a new user to the system'}
          maxWidth="2xl"
          isLoading={isLoadingUser}
        >
          <UserForm
            initialData={editingUser || undefined}
            roles={roles}
            onSubmit={handleCreate}
            onCancel={handleCancel}
            isLoading={isSubmitting}
            currentUserId={currentUser?.id}
          />
        </FormDialog>
      </div>
    </ProtectedPage>
  );
}

export default function UsersPage() {
  // Wrap content that uses useSearchParams in a Suspense boundary
  return (
    <Suspense>
      <UsersPageContent />
    </Suspense>
  );
}
