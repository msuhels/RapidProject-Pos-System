'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RoleList } from '@/core/components/roles/RoleList';
import { EnhancedPermissionAssignment } from '@/core/components/roles/EnhancedPermissionAssignment';
import { RoleForm } from '@/core/components/roles/RoleForm';
import { FormDialog } from '@/core/components/common/FormDialog';
import { Card, CardContent } from '@/core/components/ui/card';
import { PageHeader } from '@/core/components/common/PageHeader';
import { ProtectedPage } from '@/core/components/common/ProtectedPage';
import { usePermissionProps } from '@/core/components/common/PermissionGate';
import { useAuthStore } from '@/core/store/authStore';
import { type CreateRoleInput, type UpdateRoleInput } from '@/core/lib/validations/roles';
import type { Role } from '@/core/lib/db/baseSchema';
import { toast } from 'sonner';

function RolesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();
  const { canCreate, canUpdate, canDelete, canManage } = usePermissionProps('roles');
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showPermissionAssignment, setShowPermissionAssignment] = useState(false);
  const [selectedRole, setSelectedRole] = useState<{ id: string; name: string } | null>(null);
  const [loadingRole, setLoadingRole] = useState(false);

  // Derive current action from URL so dialog labels don't flicker
  const action = searchParams.get('action');
  const isCreateMode = action === 'create';
  const isEditMode = action === 'edit';

  // Handle URL-based navigation for edit action (when coming from direct URL)
  useEffect(() => {
    const roleId = searchParams.get('roleId');
    
    if (!token) return;

    if (isCreateMode) {
      setShowForm(true);
      setEditingRole(null);
      setLoadingRole(false);
    } else if (isEditMode && roleId) {
      setShowForm(true);
      setLoadingRole(true);
      // Fetch role details for editing
      fetch(`/api/roles/${roleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.role) {
            // API returns an object with `{ role, userCount }`
            setEditingRole(data.data.role as Role);
          } else {
            toast.error('Failed to load role details');
            router.push('/roles');
          }
        })
        .catch(err => {
          console.error('Failed to load role:', err);
          toast.error('Failed to load role details');
          router.push('/roles');
        })
        .finally(() => setLoadingRole(false));
    } else if (action === 'configure' && roleId) {
      setShowPermissionAssignment(true);
      setLoadingRole(true);
      // Fetch role details for permission configuration
      fetch(`/api/roles/${roleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.role) {
            // API returns an object with `{ role, userCount }`
            setSelectedRole({ id: roleId, name: data.data.role.name as string });
          } else {
            toast.error('Failed to load role details');
            router.push('/roles');
          }
        })
        .catch(err => {
          console.error('Failed to load role:', err);
          toast.error('Failed to load role details');
          router.push('/roles');
        })
        .finally(() => setLoadingRole(false));
    } else if (!action || (action !== 'create' && action !== 'edit' && action !== 'configure')) {
      // No action in URL, show list
      setShowForm(false);
      setShowPermissionAssignment(false);
      setEditingRole(null);
      setSelectedRole(null);
      setLoadingRole(false);
    }
  }, [searchParams, token, router, isCreateMode, isEditMode, action]);

  const handleCreate = async (data: CreateRoleInput | UpdateRoleInput) => {
    if (!token) {
      toast.error('You must be logged in to create roles');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingRole ? `/api/roles/${editingRole.id}` : '/api/roles';
      const method = editingRole ? 'PATCH' : 'POST';

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
        throw new Error(result.error || 'Failed to save role');
      }

      toast.success(editingRole ? 'Role updated successfully' : 'Role created successfully');
      // Navigate back to list
      router.push('/roles');
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (role: Role) => {
    router.push(`/roles?action=edit&roleId=${role.id}`);
  };

  const handleCancel = () => {
    router.push('/roles');
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open && !isSubmitting) {
      router.push('/roles');
    }
  };

  const handleConfigurePermissions = (role: Role, moduleCode?: string) => {
    // Set role data immediately and show permission assignment
    setSelectedRole({ id: role.id, name: role.name });
    setShowPermissionAssignment(true);

    const moduleQuery = moduleCode ? `&module=${encodeURIComponent(moduleCode.toLowerCase())}` : '';

    // Update URL to reflect the action and optional module
    router.push(`/roles?action=configure&roleId=${role.id}${moduleQuery}`, { scroll: false });
  };

  const handleBackFromPermissions = () => {
    router.push('/roles');
    setRefreshTrigger((prev) => prev + 1); // Refresh to show updated permissions
  };

  // if (loadingRole) {
  //   return (
  //     <div className="w-full">
  //       <Card>
  //         <CardContent className="py-8 sm:py-12">
  //           <div className="flex flex-col items-center justify-center gap-4">
  //             <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary"></div>
  //             <p className="text-sm text-muted-foreground">Loading role details...</p>
  //           </div>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   );
  // }

  const isPermissionView = showPermissionAssignment && !!selectedRole;

  return (
    <ProtectedPage
      permission="roles:read"
      title="Role Management"
      description="Manage roles and their permissions"
    >
      <div className="w-full">
        <PageHeader
          title="Role Management"
          description={
            isPermissionView && selectedRole
              ? `Manage roles and their permissions • Configuring permissions for "${selectedRole.name}"`
              : 'Manage roles and their permissions'
          }
        />

        {isPermissionView && selectedRole ? (
          <EnhancedPermissionAssignment
            roleId={selectedRole.id}
            roleName={selectedRole.name}
            onBack={handleBackFromPermissions}
          />
        ) : (
          <>
            <RoleList
              onCreateClick={() => router.push('/roles?action=create')}
              onEditClick={handleEdit}
              refreshTrigger={refreshTrigger}
              onConfigurePermissions={handleConfigurePermissions}
            />

            {/* Form Dialog */}
            <FormDialog
              open={showForm}
              onOpenChange={handleCloseDialog}
              title={isEditMode ? 'Edit Role' : 'Create New Role'}
              description={isEditMode ? 'Update role information and settings' : 'Add a new role to the system'}
              maxWidth="2xl"
              isLoading={loadingRole}
            >
              <RoleForm
                initialData={editingRole || undefined}
                onSubmit={handleCreate}
                onCancel={handleCancel}
                isLoading={isSubmitting}
              />
            </FormDialog>
          </>
        )}
      </div>
    </ProtectedPage>
  );
}

export default function RolesPage() {
  // Wrap content that uses useSearchParams in a Suspense boundary
  return (
    <Suspense>
      <RolesPageContent />
    </Suspense>
  );
}
