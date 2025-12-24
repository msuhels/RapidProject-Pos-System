'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Select } from '@/core/components/ui/select';
import { Edit, Trash2, Search, UserPlus } from 'lucide-react';
import type { User } from '@/core/lib/db/baseSchema';
import { useAuthStore } from '@/core/store/authStore';

interface UserTableProps {
  users: User[];
  roles?: Array<{ id: string; name: string; code: string }>;
  isLoading?: boolean;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  onCreate?: () => void;
  onSearch?: (search: string) => void;
  onRoleFilter?: (roleId: string) => void;
  onStatusFilter?: (status: string) => void;
}

export function UserTable({
  users,
  roles = [],
  isLoading = false,
  onEdit,
  onDelete,
  onCreate,
  onSearch,
  onRoleFilter,
  onStatusFilter,
}: UserTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const { user: currentUser } = useAuthStore();

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch?.(value);
  };

  const handleRoleFilter = (value: string) => {
    setSelectedRole(value);
    onRoleFilter?.(value);
  };

  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value);
    onStatusFilter?.(value);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      inactive: 'bg-muted text-muted-foreground',
      suspended: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          colors[status as keyof typeof colors] || colors.inactive
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getInitials = (name: string | null | undefined, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-3 bg-card border border-border rounded-lg px-4 py-3 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, email..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={selectedRole}
              onChange={(e) => handleRoleFilter(e.target.value)}
              options={[
                { value: '', label: 'All Roles' },
                ...roles.map((role) => ({
                  value: role.id,
                  label: role.name,
                })),
              ]}
              className="flex-1 sm:w-40"
            />
            <Select
              value={selectedStatus}
              onChange={(e) => handleStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'suspended', label: 'Suspended' },
              ]}
              className="flex-1 sm:w-40"
            />
            {onCreate && (
              <Button onClick={onCreate} className="whitespace-nowrap">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden md:block border border-border rounded-lg overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const userRoles = (user as any).roles || [];
                const primaryRole = userRoles[0];
                const initials = getInitials(user.fullName, user.email);
                const dateAdded = user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '-';

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-foreground">
                          {initials}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {user.fullName || 'No name'}
                          </div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {userRoles.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-foreground">
                            {primaryRole.name}
                          </span>
                          {userRoles.length > 1 && (
                            <span className="text-xs text-muted-foreground">
                              +{userRoles.length - 1} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No role</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{dateAdded}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {onEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (!currentUser || user.id !== currentUser.id) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(user)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View - Shown only on mobile */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No users found</div>
        ) : (
          users.map((user) => {
            const userRoles = (user as any).roles || [];
            const primaryRole = userRoles[0];
            const initials = getInitials(user.fullName, user.email);
            const dateAdded = user.createdAt
              ? new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : '-';

            return (
              <div
                key={user.id}
                className="bg-card border border-border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-foreground flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground truncate">
                        {user.fullName || 'No name'}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {getStatusBadge(user.status)}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-muted-foreground">Role: </span>
                    {userRoles.length > 0 ? (
                      <span className="text-foreground">
                        {primaryRole.name}
                        {userRoles.length > 1 && ` +${userRoles.length - 1}`}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No role</span>
                    )}
                  </div>
                  <div className="text-muted-foreground text-xs">{dateAdded}</div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-border">
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(user)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {onDelete && (!currentUser || user.id !== currentUser.id) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(user)}
                      className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

