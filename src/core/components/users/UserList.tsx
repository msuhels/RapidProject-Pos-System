'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/core/store/authStore';
import { UserTable } from './UserTable';
import { LoadingSpinner } from '@/core/components/common/LoadingSpinner';
import { EmptyState } from '@/core/components/common/EmptyState';
import { ConfirmDialog } from '@/core/components/common/ConfirmDialog';
import type { User } from '@/core/lib/db/baseSchema';
import { toast } from 'sonner';

interface UserListProps {
  onCreateClick?: () => void;
  onEditClick?: (user: User) => void;
  onDeleteClick?: (user: User) => void;
  refreshTrigger?: number; // When this changes, refetch users
}

export function UserList({ onCreateClick, onEditClick, onDeleteClick, refreshTrigger }: UserListProps) {
  const { token, user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('roleId', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/roles', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.data) {
        setRoles(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [token, searchTerm, roleFilter, statusFilter, refreshTrigger]);

  const handleDelete = (user: User) => {
    // Prevent users from deleting their own account via the User Management UI
    if (currentUser && user.id === currentUser.id) {
      toast.error('You cannot delete your own account from User Management.');
      return;
    }

    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!token || !userToDelete) return;

    setIsDeleting(true);

    try {
      console.log('[UserList] Deleting user:', userToDelete.id);
      
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      console.log('[UserList] Delete response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      toast.success(`User ${userToDelete.email} deleted successfully`);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      // Refresh users list
      fetchUsers();
    } catch (err) {
      console.error('[UserList] Delete error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner label="Loading users..." />
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={fetchUsers}
          className="mt-2 text-sm text-destructive underline hover:text-destructive/80"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <UserTable
        users={users}
        roles={roles}
        isLoading={isLoading}
        onEdit={onEditClick}
        onDelete={onDeleteClick ? handleDelete : undefined}
        onCreate={onCreateClick}
        onSearch={setSearchTerm}
        onRoleFilter={setRoleFilter}
        onStatusFilter={setStatusFilter}
      />
      
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete User"
        description={`Are you sure you want to delete ${userToDelete?.email}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}

