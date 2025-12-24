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
import { Edit, Trash2, Search, ShieldPlus } from 'lucide-react';
import type { Role } from '@/core/lib/db/baseSchema';

interface RoleTableProps {
  roles: Array<Role & { userCount?: number }>;
  isLoading?: boolean;
  onEdit?: (role: Role) => void;
  onDelete?: (role: Role) => void;
  onCreate?: () => void;
  onSearch?: (search: string) => void;
  onStatusFilter?: (status: string) => void;
}

export function RoleTable({
  roles,
  isLoading = false,
  onEdit,
  onDelete,
  onCreate,
  onSearch,
  onStatusFilter,
}: RoleTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch?.(value);
  };

  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value);
    onStatusFilter?.(value);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
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

  const getTypeBadge = (isSystem: boolean) => {
    if (isSystem) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          Default
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={selectedStatus}
            onChange={(e) => handleStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            className="w-full sm:w-40"
          />
        </div>
        {onCreate && (
          <Button onClick={onCreate} className="w-full sm:w-auto sm:self-end">
            <ShieldPlus className="h-4 w-4 mr-2" />
            Create New Role
          </Button>
        )}
      </div>

      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden md:block border border-border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading roles...
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No roles found
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => {
                return (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{role.name}</div>
                      <div className="text-sm text-muted-foreground">{role.code}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground">
                        {role.description || '-'}
                      </span>
                    </TableCell>
                    <TableCell>{getTypeBadge(role.isSystem)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground">
                        {role.userCount ?? 0}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(role.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {onEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(role)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && !role.isSystem && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(role)}
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
          <div className="text-center py-8 text-muted-foreground">Loading roles...</div>
        ) : roles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No roles found</div>
        ) : (
          roles.map((role) => {
            return (
              <div
                key={role.id}
                className="bg-card border border-border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">{role.name}</div>
                    <div className="text-sm text-muted-foreground">{role.code}</div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {getTypeBadge(role.isSystem)}
                    {getStatusBadge(role.status)}
                  </div>
                </div>

                {role.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {role.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                  <div className="text-muted-foreground">
                    <span className="font-medium text-foreground">{role.userCount ?? 0}</span> users
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-border">
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(role)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {onDelete && !role.isSystem && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(role)}
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

