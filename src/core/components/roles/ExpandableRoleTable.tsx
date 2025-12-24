'use client';

import { useState, useEffect, Fragment } from 'react';
import { useAuthStore } from '@/core/store/authStore';
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
import { Edit, Trash2, Search, ShieldPlus, ChevronRight, Settings } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
import type { Role } from '@/core/lib/db/baseSchema';
import { LoadingSpinner } from '@/core/components/common/LoadingSpinner';

interface ModulePermission {
  moduleId: string;
  moduleName: string;
  moduleCode: string;
  hasAccess: boolean;
  dataAccess: 'none' | 'own' | 'team' | 'all';
  permissions: Array<{
    permissionId: string;
    permissionName: string;
    permissionCode: string;
    granted: boolean;
  }>;
  totalPermissions?: number;
}

interface ExpandableRoleTableProps {
  roles: Array<Role & { userCount?: number }>;
  isLoading?: boolean;
  onEdit?: (role: Role) => void;
  onDelete?: (role: Role) => void;
  onCreate?: () => void;
  onSearch?: (search: string) => void;
  onStatusFilter?: (status: string) => void;
  onConfigurePermissions?: (role: Role, moduleCode?: string) => void;
}

export function ExpandableRoleTable({
  roles,
  isLoading = false,
  onEdit,
  onDelete,
  onCreate,
  onSearch,
  onStatusFilter,
  onConfigurePermissions,
}: ExpandableRoleTableProps) {
  const { token } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
  const [rolePermissions, setRolePermissions] = useState<Record<string, ModulePermission[]>>({});
  const [loadingPermissions, setLoadingPermissions] = useState<Set<string>>(new Set());

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch?.(value);
  };

  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value);
    onStatusFilter?.(value);
  };

  const toggleRoleExpansion = async (roleId: string) => {
    const newExpanded = new Set(expandedRoles);
    if (newExpanded.has(roleId)) {
      // Collapse immediately
      newExpanded.delete(roleId);
      setExpandedRoles(newExpanded);
    } else {
      // Expand immediately to show loading state
      newExpanded.add(roleId);
      setExpandedRoles(newExpanded);
      
      // Load permissions if not already loaded
      if (!rolePermissions[roleId] && token) {
        await loadRolePermissions(roleId);
      }
    }
  };

  const loadRolePermissions = async (roleId: string) => {
    if (!token) return;

    setLoadingPermissions((prev) => new Set(prev).add(roleId));

    try {
      const response = await fetch(`/api/roles/${roleId}/permissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.modulePermissions) {
        // Transform the data to match the expected format - SHOW ALL MODULES
        const modules = data.modulePermissions.map((module: any) => {
          const grantedPermissions = module.permissions.filter((p: any) => p.granted);
          const hasAccess = module.hasAccess ?? grantedPermissions.length > 0;
          
          return {
            moduleId: module.moduleId,
            moduleName: module.moduleName,
            moduleCode: module.moduleCode,
            hasAccess,
            dataAccess: (module.dataAccess as ModulePermission['dataAccess']) || (hasAccess ? 'team' : 'none'),
            permissions: grantedPermissions.map((p: any) => ({
              permissionId: p.permissionId,
              permissionName: p.permissionName,
              permissionCode: p.permissionCode,
              granted: true,
            })),
            totalPermissions: module.permissions.length,
          };
        });
        // Show ALL modules, even if they have no granted permissions

        setRolePermissions((prev) => ({
          ...prev,
          [roleId]: modules,
        }));
      }
    } catch (err) {
      console.error('Failed to load role permissions:', err);
    } finally {
      setLoadingPermissions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(roleId);
        return newSet;
      });
    }
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

  const getDataAccessBadge = (dataAccess: string) => {
    if (dataAccess === 'all') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          All Data
        </span>
      );
    }
    if (dataAccess === 'team') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
          Team Data
        </span>
      );
    }
    if (dataAccess === 'own') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          Own Data
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card border border-border rounded-lg px-4 py-3 shadow-sm">
        <div className="flex flex-1 gap-2 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
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
            className="w-40"
          />
        </div>
        {onCreate && (
          <Button onClick={onCreate} className="w-full sm:w-auto whitespace-nowrap">
            <ShieldPlus className="h-4 w-4 mr-2" />
            Create New Role
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
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
                <TableCell colSpan={7} className="text-center py-8">
                  Loading roles...
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No roles found
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => {
                const isExpanded = expandedRoles.has(role.id);
                const modules = rolePermissions[role.id] || [];
                const isLoadingPerms = loadingPermissions.has(role.id);

                return (
                  <Fragment key={role.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => toggleRoleExpansion(role.id)}
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRoleExpansion(role.id);
                          }}
                          className="p-0 h-6 w-6"
                          disabled={isLoadingPerms}
                        >
                          <ChevronRight 
                            className={`h-4 w-4 transition-transform duration-300 ${
                              isExpanded ? 'rotate-90' : 'rotate-0'
                            }`}
                          />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{role.name}</div>
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
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <TableCell colSpan={7} className="bg-muted/50 dark:bg-muted/30 p-4">
                          {isLoadingPerms ? (
                            <div className="flex justify-center py-8 animate-in fade-in duration-200">
                              <LoadingSpinner label="Loading permissions..." />
                            </div>
                          ) : modules.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4 animate-in fade-in duration-200">
                              No module permissions configured
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
                              {modules
                                .filter(module => module.moduleCode.toLowerCase() !== 'profile')
                                .map((module, index) => (
                                <Card 
                                  key={module.moduleId} 
                                  className="bg-card animate-in fade-in slide-in-from-bottom-2 duration-300"
                                  style={{ animationDelay: `${index * 50}ms` }}
                                >
                                  <CardHeader className="pb-3">
                                    <div className="flex flex-col">
                                      <CardTitle className="text-sm font-medium">
                                        {module.moduleName}
                                      </CardTitle>
                                      <span className="text-xs text-muted-foreground mt-1">
                                        {module.permissions.length} of {module.totalPermissions || module.permissions.length} permissions
                                      </span>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="pt-0 space-y-2">
                                    {!module.hasAccess ? (
                                      <div className="text-xs text-muted-foreground">
                                        <p>No permissions granted</p>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="text-xs text-foreground mb-2">
                                          {getDataAccessBadge(module.dataAccess)}
                                        </div>
                                        {module.permissions.length > 0 && (
                                          <div className="flex flex-wrap gap-1">
                                            {module.permissions.map((perm, permIndex) => {
                                              const permKey =
                                                perm.permissionId ||
                                                perm.permissionCode ||
                                                perm.permissionName ||
                                                `${module.moduleId}-perm-${permIndex}`;
                                              const permLabel =
                                                perm.permissionName ||
                                                perm.permissionCode ||
                                                perm.permissionId ||
                                                'permission';
                                              return (
                                                <span
                                                  key={`${module.moduleId}-${permKey}`}
                                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                >
                                                  {permLabel}
                                                </span>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </>
                                    )}

                                    {onConfigurePermissions && (
                                      <div className="pt-3 border-t border-border flex justify-end">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => onConfigurePermissions(role, module.moduleCode)}
                                        >
                                          <Settings className="h-4 w-4 mr-2" />
                                          Configure
                                        </Button>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

