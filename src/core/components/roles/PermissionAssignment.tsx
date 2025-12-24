'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/core/store/authStore';
import { Button } from '@/core/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
import { ArrowLeft, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { LoadingSpinner } from '@/core/components/common/LoadingSpinner';
import { toast } from 'sonner';

interface Permission {
  id: string;
  code: string;
  name: string;
  action: string;
  resource: string | null;
  isDangerous: boolean;
  requiresMfa: boolean;
  description: string | null;
  granted: boolean;
}

interface ModulePermissions {
  moduleId: string;
  moduleName: string;
  moduleCode: string;
  icon: string | null;
  permissions: Permission[];
}

interface PermissionAssignmentProps {
  roleId: string;
  roleName: string;
  onBack: () => void;
}

export function PermissionAssignment({
  roleId,
  roleName,
  onBack,
}: PermissionAssignmentProps) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modulePermissions, setModulePermissions] = useState<ModulePermissions[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRolePermissions();
  }, [roleId, token]);

  const loadRolePermissions = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/roles/${roleId}/permissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load permissions');
      }

      const data = await response.json();
      setModulePermissions(data.modulePermissions || []);

      // Set initially granted permissions
      const granted = new Set<string>();
      data.modulePermissions?.forEach((module: ModulePermissions) => {
        module.permissions.forEach((perm: Permission) => {
          if (perm.granted) {
            granted.add(perm.id);
          }
        });
      });
      setSelectedPermissions(granted);

      // Expand modules that have granted permissions
      const expanded = new Set<string>();
      data.modulePermissions?.forEach((module: ModulePermissions) => {
        if (module.permissions.some((p: Permission) => p.granted)) {
          expanded.add(module.moduleId);
        }
      });
      setExpandedModules(expanded);
    } catch (error) {
      console.error('Failed to load role permissions:', error);
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const togglePermission = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const toggleAllModulePermissions = (moduleId: string, permissions: Permission[]) => {
    const newSelected = new Set(selectedPermissions);
    const allSelected = permissions.every(p => newSelected.has(p.id));

    if (allSelected) {
      // Deselect all
      permissions.forEach(p => newSelected.delete(p.id));
    } else {
      // Select all
      permissions.forEach(p => newSelected.add(p.id));
    }
    setSelectedPermissions(newSelected);
  };

  const handleSave = async () => {
    if (!token) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          permissionIds: Array.from(selectedPermissions),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update permissions');
      }

      toast.success('Permissions updated successfully');
    } catch (error) {
      console.error('Failed to update permissions:', error);
      toast.error('Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Permission Assignment</h2>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Role: <span className="font-medium">{roleName}</span>
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Update Changes'}
        </Button>
      </div>

      {/* Module Permissions */}
      <div className="space-y-3 sm:space-y-4">
        {modulePermissions.map((module) => {
          const isExpanded = expandedModules.has(module.moduleId);
          const selectedCount = module.permissions.filter(p => selectedPermissions.has(p.id)).length;
          const totalCount = module.permissions.length;
          const allSelected = selectedCount === totalCount && totalCount > 0;

          return (
            <Card key={module.moduleId}>
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors p-4 sm:p-6"
                onClick={() => toggleModule(module.moduleId)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base sm:text-lg font-semibold truncate">
                        {module.moduleName}
                      </CardTitle>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        ({selectedCount}/{totalCount} selected)
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAllModulePermissions(module.moduleId, module.permissions);
                    }}
                    className="w-full sm:w-auto"
                  >
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="p-3 sm:p-6">
                  <div className="space-y-2">
                    {module.permissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.has(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                          className="mt-1 w-4 h-4 text-primary border-border rounded focus:ring-primary flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-foreground text-sm sm:text-base">
                              {permission.name}
                            </span>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {permission.code}
                            </code>
                            {permission.isDangerous && (
                              <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded">
                                Dangerous
                              </span>
                            )}
                            {permission.requiresMfa && (
                              <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded">
                                Requires MFA
                              </span>
                            )}
                          </div>
                          {permission.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                              {permission.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {modulePermissions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No permissions available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
