'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/core/store/authStore';
import { ExpandableRoleTable } from './ExpandableRoleTable';
import { LoadingSpinner } from '@/core/components/common/LoadingSpinner';
import { EmptyState } from '@/core/components/common/EmptyState';
import { ConfirmDialog } from '@/core/components/common/ConfirmDialog';
import type { Role } from '@/core/lib/db/baseSchema';
import { toast } from 'sonner';

interface RoleListProps {
  onCreateClick?: () => void;
  onEditClick?: (role: Role) => void;
  refreshTrigger?: number; // When this changes, refetch roles
  onConfigurePermissions?: (role: Role, moduleCode?: string) => void;
}

export function RoleList({ onCreateClick, onEditClick, refreshTrigger, onConfigurePermissions }: RoleListProps) {
  const { token } = useAuthStore();
  const [roles, setRoles] = useState<Array<Role & { userCount?: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRoles = async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/roles?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch roles');
      }

      setRoles(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [token, searchTerm, statusFilter, refreshTrigger]);

  const handleDelete = (role: Role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!token || !roleToDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/roles/${roleToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete role');
      }

      toast.success('Role deleted successfully');
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
      fetchRoles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete role');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && roles.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner label="Loading roles..." />
      </div>
    );
  }

  if (error && roles.length === 0) {
    return (
      <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={fetchRoles}
          className="mt-2 text-sm text-destructive underline hover:text-destructive/80"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <ExpandableRoleTable
        roles={roles}
        isLoading={isLoading}
        onEdit={onEditClick}
        onDelete={handleDelete}
        onCreate={onCreateClick}
        onSearch={setSearchTerm}
        onStatusFilter={setStatusFilter}
        onConfigurePermissions={onConfigurePermissions}
      />
      
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Role"
        description={`Are you sure you want to delete the role "${roleToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}

