'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  hasAccess?: boolean;
  dataAccess?: 'none' | 'own' | 'team' | 'all';
  permissions: Permission[];
  fields?: ModuleField[];
}

interface ModuleField {
  fieldId: string;
  fieldName: string;
  fieldCode: string;
  fieldLabel: string;
  isVisible?: boolean;
  isEditable?: boolean;
}

interface FieldPermission {
  fieldId: string;
  fieldName: string;
  visible: boolean;
  editable: boolean;
}

interface SettingsSubmenuConfig {
  enabled: boolean;
  read: boolean;
  update: boolean;
}

interface ModuleConfig {
  moduleId: string ;
  enabled: boolean;
  dataAccess: 'none' | 'own' | 'team' | 'all';
  permissions: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    import?: boolean;
    export?: boolean;
    manage_labels?: boolean;
    duplicate?: boolean;
    manage: boolean;
  };
  fieldPermissions: Record<string, FieldPermission>;
  settingsSubmenus?: Record<string, SettingsSubmenuConfig>;
}

interface EnhancedPermissionAssignmentProps {
  roleId: string;
  roleName: string;
  onBack: () => void;
}

export function EnhancedPermissionAssignment({
  roleId,
  roleName,
  onBack,
}: EnhancedPermissionAssignmentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modulePermissions, setModulePermissions] = useState<ModulePermissions[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    modulePermissions: true,
    settingsSubmenus: true,
    dataPermission: true,
    fieldPermission: true,
  });
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [moduleConfigs, setModuleConfigs] = useState<Record<string, ModuleConfig>>({});
  const hasUnsavedChangesRef = useRef(false);
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    initialLoadDoneRef.current = false;
    hasUnsavedChangesRef.current = false;
    loadRolePermissions();
  }, [roleId, token]);

  // Auto-select module from URL or Settings module when data loads
  useEffect(() => {
    if (modulePermissions.length === 0) return;

    const moduleFromUrl = searchParams.get('module');

    // Prefer module from URL when available
    if (moduleFromUrl) {
      const moduleExists = modulePermissions.find(
        (m) => m.moduleCode.toLowerCase() === moduleFromUrl.toLowerCase()
      );

      if (moduleExists) {
        setSelectedModule(moduleExists.moduleId);
        return;
      }
    }

    // Fallback: prefer Settings module, otherwise first module
    if (!selectedModule) {
      const settingsModule = modulePermissions.find(
        (m) => m.moduleCode.toLowerCase() === 'settings'
      );
      const moduleToSelect = settingsModule || modulePermissions[0];
      if (moduleToSelect) {
        setSelectedModule(moduleToSelect.moduleId);
        updateUrl(moduleToSelect.moduleCode);
      }
    }
  }, [modulePermissions, searchParams, selectedModule]);

  // Update URL when module changes (used when falling back to first module)
  const updateUrl = (moduleCode: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('module', moduleCode.toLowerCase());
    // Use router.replace to update URL properly with Next.js
    router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  };

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

      const normalizeCode = (code?: string) => (typeof code === 'string' ? code : '');
      const deriveAction = (code: string) => {
        const parts = code.split(':');
        return parts[parts.length - 1] || '';
      };

      const normalizedModules: ModulePermissions[] = (data.modulePermissions || [])
        // Filter out profile module - it should be viewable and updatable by every user for their own profile
        .filter((module: any) => normalizeCode(module.moduleCode || module.module_code).toLowerCase() !== 'profile')
        .map((module: any) => {
          const moduleCode = normalizeCode(module.moduleCode || module.code);
          const moduleCodeLower = moduleCode.toLowerCase();
          
          
          return {
            moduleId: module.moduleId || module.module_id,
            moduleName: module.moduleName || module.module_name || module.name,
            moduleCode,
            icon: module.icon ?? null,
            hasAccess: Boolean(module.hasAccess ?? module.has_access),
            dataAccess: (module.dataAccess ?? module.data_access ?? 'none') as ModuleConfig['dataAccess'],
            permissions: (module.permissions || []).map((perm: any) => {
              const code = normalizeCode(perm.permissionCode || perm.code).toLowerCase();
              return {
                id: perm.permissionId || perm.id,
                code,
                name: perm.permissionName || perm.name,
                action: (perm.permissionAction || perm.action || deriveAction(code)).toLowerCase(),
                resource: null,
                isDangerous: false,
                requiresMfa: false,
                description: null,
                granted: Boolean(perm.granted),
              } as Permission;
            }),
            fields: (module.fields || []).map((field: any) => ({
              fieldId: field.fieldId || field.id,
              fieldName: field.fieldName || field.name,
              fieldCode: field.fieldCode || field.code,
              fieldLabel: field.fieldLabel || field.label || field.name,
              isVisible: Boolean(field.isVisible),
              isEditable: Boolean(field.isEditable),
            })),
          };
        });

      setModulePermissions(normalizedModules);

      // Initialize module configs - only on initial load or if no unsaved changes exist
      // This prevents overwriting user's unsaved changes
      if (!initialLoadDoneRef.current || !hasUnsavedChangesRef.current) {
        const configs: Record<string, ModuleConfig> = {};
        normalizedModules.forEach((module: ModulePermissions) => {
          const normalizeCode = (code?: string) => (typeof code === 'string' ? code : '');
          const grantedPerms = module.permissions.filter(p => p.granted);
          const isSettings = normalizeCode(module.moduleCode).toLowerCase() === 'settings';
          const moduleCodeLower = normalizeCode(module.moduleCode).toLowerCase();
          const enabled = module.hasAccess ?? grantedPerms.length > 0;

          const fieldPermissions: Record<string, FieldPermission> = {};
          (module.fields || []).forEach((field) => {
            fieldPermissions[field.fieldId] = {
              fieldId: field.fieldId,
              fieldName: field.fieldLabel || field.fieldName,
              visible: field.isVisible ?? false,
              editable: (field.isEditable ?? false) && (field.isVisible ?? false),
            };
          });
          
          const config: ModuleConfig = {
            moduleId: module.moduleId,
            enabled,
            dataAccess: module.dataAccess || (enabled ? 'team' : 'none'),
            permissions: {
              // Check for basic module read permission - match by action OR code pattern
              view: grantedPerms.some(p => {
                const pCode = normalizeCode(p.code).toLowerCase();
                return p.action === 'read' || pCode === `${moduleCodeLower}:read`;
              }),
              create: grantedPerms.some(p => {
                const pCode = normalizeCode(p.code).toLowerCase();
                return p.action === 'create' || pCode === `${moduleCodeLower}:create`;
              }),
              // Check for basic module update permission - match by action OR code pattern
              update: grantedPerms.some(p => {
                const pCode = normalizeCode(p.code).toLowerCase();
                return p.action === 'update' || pCode === `${moduleCodeLower}:update`;
              }),
              delete: grantedPerms.some(p => {
                const pCode = normalizeCode(p.code).toLowerCase();
                return p.action === 'delete' || pCode === `${moduleCodeLower}:delete`;
              }),
              import: grantedPerms.some(p => {
                const pCode = normalizeCode(p.code).toLowerCase();
                return p.action === 'import' || pCode === `${moduleCodeLower}:import`;
              }),
              export: grantedPerms.some(p => {
                const pCode = normalizeCode(p.code).toLowerCase();
                return p.action === 'export' || pCode === `${moduleCodeLower}:export`;
              }),
              manage_labels: grantedPerms.some(p => {
                const pCode = normalizeCode(p.code).toLowerCase();
                return p.action === 'manage_labels' || pCode === `${moduleCodeLower}:manage_labels`;
              }),
              duplicate: grantedPerms.some(p => {
                const pCode = normalizeCode(p.code).toLowerCase();
                return p.action === 'duplicate' || pCode === `${moduleCodeLower}:duplicate`;
              }),
              manage: grantedPerms.some(p => {
                const pCode = normalizeCode(p.code).toLowerCase();
                return p.action === 'manage' || pCode.endsWith(':*');
              }),
            },
            fieldPermissions,
          };

          // Add settings submenus configuration
          if (isSettings) {
            const submenus: Record<string, SettingsSubmenuConfig> = {
              'general': {
                enabled: grantedPerms.some(p => p.code.includes('settings:general')),
                read: grantedPerms.some(p => p.code === 'settings:general:read'),
                update: grantedPerms.some(p => p.code === 'settings:general:update'),
              },
              'registration': {
                enabled: grantedPerms.some(p => p.code.includes('settings:registration')),
                read: grantedPerms.some(p => p.code === 'settings:registration:read'),
                update: grantedPerms.some(p => p.code === 'settings:registration:update'),
              },
              'notification-methods': {
                enabled: grantedPerms.some(p => p.code.includes('settings:notification-methods')),
                read: grantedPerms.some(p => p.code === 'settings:notification-methods:read'),
                update: grantedPerms.some(p => p.code === 'settings:notification-methods:update'),
              },
              'smtp-settings': {
                enabled: grantedPerms.some(p => p.code.includes('settings:smtp-settings')),
                read: grantedPerms.some(p => p.code === 'settings:smtp-settings:read'),
                update: grantedPerms.some(p => p.code === 'settings:smtp-settings:update'),
              },
              'custom-fields': {
                enabled: grantedPerms.some(p => p.code.includes('settings:custom-fields')),
                read: grantedPerms.some(p => p.code === 'settings:custom-fields:read'),
                update: grantedPerms.some(p => p.code === 'settings:custom-fields:update'),
              },
            };
            config.settingsSubmenus = submenus;
          }

          configs[module.moduleId] = config;
        });
        setModuleConfigs(configs);
      } else {
        // If there are unsaved changes, only initialize configs for new modules that don't exist yet
        setModuleConfigs(prev => {
          const updated = { ...prev };
          normalizedModules.forEach((module: ModulePermissions) => {
            // Only initialize if this module config doesn't exist yet
            if (!updated[module.moduleId]) {
              const normalizeCode = (code?: string) => (typeof code === 'string' ? code : '');
              const grantedPerms = module.permissions.filter(p => p.granted);
              const isSettings = normalizeCode(module.moduleCode).toLowerCase() === 'settings';
              const moduleCodeLower = normalizeCode(module.moduleCode).toLowerCase();
              const enabled = module.hasAccess ?? grantedPerms.length > 0;

              const fieldPermissions: Record<string, FieldPermission> = {};
              (module.fields || []).forEach((field) => {
                fieldPermissions[field.fieldId] = {
                  fieldId: field.fieldId,
                  fieldName: field.fieldLabel || field.fieldName,
                  visible: field.isVisible ?? false,
                  editable: (field.isEditable ?? false) && (field.isVisible ?? false),
                };
              });
              
              const config: ModuleConfig = {
                moduleId: module.moduleId,
                enabled,
                dataAccess: module.dataAccess || (enabled ? 'team' : 'none'),
                permissions: {
                  // Check for basic module read permission - match by action OR code pattern
                  view: grantedPerms.some(p => {
                    const pCode = normalizeCode(p.code).toLowerCase();
                    return p.action === 'read' || pCode === `${moduleCodeLower}:read`;
                  }),
                  create: grantedPerms.some(p => {
                    const pCode = normalizeCode(p.code).toLowerCase();
                    return p.action === 'create' || pCode === `${moduleCodeLower}:create`;
                  }),
                  // Check for basic module update permission - match by action OR code pattern
                  update: grantedPerms.some(p => {
                    const pCode = normalizeCode(p.code).toLowerCase();
                    return p.action === 'update' || pCode === `${moduleCodeLower}:update`;
                  }),
                  delete: grantedPerms.some(p => {
                    const pCode = normalizeCode(p.code).toLowerCase();
                    return p.action === 'delete' || pCode === `${moduleCodeLower}:delete`;
                  }),
                  import: grantedPerms.some(p => {
                    const pCode = normalizeCode(p.code).toLowerCase();
                    return p.action === 'import' || pCode === `${moduleCodeLower}:import`;
                  }),
                  export: grantedPerms.some(p => {
                    const pCode = normalizeCode(p.code).toLowerCase();
                    return p.action === 'export' || pCode === `${moduleCodeLower}:export`;
                  }),
                  manage_labels: grantedPerms.some(p => {
                    const pCode = normalizeCode(p.code).toLowerCase();
                    return p.action === 'manage_labels' || pCode === `${moduleCodeLower}:manage_labels`;
                  }),
                  duplicate: grantedPerms.some(p => {
                    const pCode = normalizeCode(p.code).toLowerCase();
                    return p.action === 'duplicate' || pCode === `${moduleCodeLower}:duplicate`;
                  }),
                  manage: grantedPerms.some(p => {
                    const pCode = normalizeCode(p.code).toLowerCase();
                    return p.action === 'manage' || pCode.endsWith(':*');
                  }),
                },
                fieldPermissions,
              };

              if (isSettings) {
                const submenus: Record<string, SettingsSubmenuConfig> = {
                  'general': {
                    enabled: grantedPerms.some(p => p.code.includes('settings:general')),
                    read: grantedPerms.some(p => p.code === 'settings:general:read'),
                    update: grantedPerms.some(p => p.code === 'settings:general:update'),
                  },
                  'registration': {
                    enabled: grantedPerms.some(p => p.code.includes('settings:registration')),
                    read: grantedPerms.some(p => p.code === 'settings:registration:read'),
                    update: grantedPerms.some(p => p.code === 'settings:registration:update'),
                  },
                  'notification-methods': {
                    enabled: grantedPerms.some(p => p.code.includes('settings:notification-methods')),
                    read: grantedPerms.some(p => p.code === 'settings:notification-methods:read'),
                    update: grantedPerms.some(p => p.code === 'settings:notification-methods:update'),
                  },
                  'smtp-settings': {
                    enabled: grantedPerms.some(p => p.code.includes('settings:smtp-settings')),
                    read: grantedPerms.some(p => p.code === 'settings:smtp-settings:read'),
                    update: grantedPerms.some(p => p.code === 'settings:smtp-settings:update'),
                  },
                  'custom-fields': {
                    enabled: grantedPerms.some(p => p.code.includes('settings:custom-fields')),
                    read: grantedPerms.some(p => p.code === 'settings:custom-fields:read'),
                    update: grantedPerms.some(p => p.code === 'settings:custom-fields:update'),
                  },
                };
                config.settingsSubmenus = submenus;
              }

              updated[module.moduleId] = config;
            }
          });
          return updated;
        });
      }

      initialLoadDoneRef.current = true;

      // Don't auto-select here - let the useEffect handle it based on URL
      // This prevents overriding user's tab selection
    } catch (error) {
      console.error('Failed to load role permissions:', error);
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateModuleConfig = (moduleId: string, updates: Partial<ModuleConfig>) => {
    hasUnsavedChangesRef.current = true;
    setModuleConfigs(prev => {
      const existingConfig = prev[moduleId];
      const module = modulePermissions.find(m => m.moduleId === moduleId);
      
      // If config doesn't exist, initialize it with defaults
      if (!existingConfig && module) {
        const isSettings = module.moduleCode.toLowerCase() === 'settings';
        const fieldPermissions: Record<string, FieldPermission> = {};
        (module.fields || []).forEach((field) => {
          fieldPermissions[field.fieldId] = {
            fieldId: field.fieldId,
            fieldName: field.fieldLabel || field.fieldName,
            visible: false,
            editable: false,
          };
        });
        const baseConfig: ModuleConfig = {
          moduleId: moduleId,
          enabled: false,
          dataAccess: 'none',
          permissions: {
            view: false,
            create: false,
            update: false,
            delete: false,
            import: false,
            export: false,
            manage_labels: false,
            duplicate: false,
            manage: false,
          },
          fieldPermissions,
        };
        
        if (isSettings) {
          baseConfig.settingsSubmenus = {
            'general': { enabled: false, read: false, update: false },
            'registration': { enabled: false, read: false, update: false },
            'notification-methods': { enabled: false, read: false, update: false },
            'smtp-settings': { enabled: false, read: false, update: false },
            'custom-fields': { enabled: false, read: false, update: false },
          };
        }
        
        return {
          ...prev,
          [moduleId]: {
            ...baseConfig,
            ...updates,
          },
        };
      }
      
      return {
        ...prev,
        [moduleId]: {
          ...existingConfig,
          ...updates,
        },
      };
    });
  };

  const toggleModuleEnabled = (moduleId: string) => {
    const config = moduleConfigs[moduleId];
    updateModuleConfig(moduleId, { enabled: !config?.enabled });
  };

  const togglePermission = (moduleId: string, permissionKey: keyof ModuleConfig['permissions']) => {
    const config = moduleConfigs[moduleId];
    if (!config) return;

    updateModuleConfig(moduleId, {
      permissions: {
        ...config.permissions,
        [permissionKey]: !config.permissions[permissionKey],
      },
    });
  };

  const setDataAccess = (moduleId: string, access: ModuleConfig['dataAccess']) => {
    updateModuleConfig(moduleId, { dataAccess: access });
  };

  const toggleFieldPermission = (moduleId: string, fieldId: string, type: 'visible' | 'editable') => {
    const config = moduleConfigs[moduleId];
    if (!config) return;

    const currentField = config.fieldPermissions[fieldId] || { fieldId, fieldName: fieldId, visible: false, editable: false };
    
    updateModuleConfig(moduleId, {
      fieldPermissions: {
        ...config.fieldPermissions,
        [fieldId]: {
          ...currentField,
          [type]: !currentField[type],
          // If making editable, must also be visible
          ...(type === 'editable' && !currentField.editable ? { visible: true } : {}),
          // If making invisible, must also be non-editable
          ...(type === 'visible' && currentField.visible ? { editable: false } : {}),
        },
      },
    });
  };

  const toggleSettingsSubmenu = (moduleId: string, submenuKey: string, enabled: boolean) => {
    const config = moduleConfigs[moduleId];
    if (!config || !config.settingsSubmenus) return;

    updateModuleConfig(moduleId, {
      settingsSubmenus: {
        ...config.settingsSubmenus,
        [submenuKey]: {
          ...config.settingsSubmenus[submenuKey],
          enabled,
          // If disabling, also disable read and update
          ...(enabled ? {} : { read: false, update: false }),
        },
      },
    });
  };

  const toggleSettingsSubmenuPermission = (moduleId: string, submenuKey: string, permission: 'read' | 'update') => {
    const config = moduleConfigs[moduleId];
    if (!config || !config.settingsSubmenus) return;

    const submenu = config.settingsSubmenus[submenuKey];
    if (!submenu) return;

    updateModuleConfig(moduleId, {
      settingsSubmenus: {
        ...config.settingsSubmenus,
        [submenuKey]: {
          ...submenu,
          [permission]: !submenu[permission],
          // If enabling read or update, also enable the submenu
          enabled: !submenu[permission] ? true : submenu.enabled,
        },
      },
    });
  };

  const handleSave = async () => {
    if (!token) return;
    if (!selectedModule) return;

    setSaving(true);
    try {
      const permissionIds: string[] = [];

      // Only save the currently selected module's configuration.
      const modulesPayload = Object.entries(moduleConfigs)
        .filter(([moduleId]) => moduleId === selectedModule)
        .map(([moduleId, config]) => {
        const module = modulePermissions.find(m => m.moduleId === moduleId);
        if (!module) return null;

        const normalizeCode = (code?: string) => (typeof code === 'string' ? code : '');
        const moduleCodeLower = normalizeCode(module.moduleCode).toLowerCase();
        const isSettings = moduleCodeLower === 'settings';

        // Include ALL permissions for this module, not just the ones that should be granted
        // This ensures the API can properly update all permissions
        const permissionsPayload = module.permissions.map(perm => {
          let shouldGrant = false;
          const permCode = normalizeCode(perm.code).toLowerCase();
          const permId = perm.id || (perm as any).permissionId;

          if (!permId) {
            // Skip permissions without IDs
            return null;
          }

          if (config.enabled) {
            // Handle settings submenu permissions separately
            if (isSettings && config.settingsSubmenus) {
              // Check if this is a submenu permission
              const submenuKeys = Object.keys(config.settingsSubmenus);
              const isSubmenuPerm = submenuKeys.some(key => permCode.includes(`settings:${key}`));
              
              if (isSubmenuPerm) {
                // Check each submenu
                for (const [submenuKey, submenuConfig] of Object.entries(config.settingsSubmenus)) {
                  if (submenuConfig.enabled) {
                    if (permCode === `settings:${submenuKey}:read` && submenuConfig.read) {
                      shouldGrant = true;
                      break;
                    }
                    if (permCode === `settings:${submenuKey}:update` && submenuConfig.update) {
                      shouldGrant = true;
                      break;
                    }
                  }
                }
              } else {
                // Handle main settings permissions (not submenu-specific)
                // Main settings permissions are: settings:read, settings:update, settings:*
                const isMainSettingsPerm = permCode === 'settings:read' || 
                                          permCode === 'settings:update' || 
                                          permCode === 'settings:*';
                
                if (isMainSettingsPerm) {
                  if (config.permissions.manage && permCode === 'settings:*') {
                    shouldGrant = true;
                  } else if (config.permissions.view && permCode === 'settings:read') {
                    shouldGrant = true;
                  } else if (config.permissions.update && permCode === 'settings:update') {
                    shouldGrant = true;
                  }
                }
              }
            } else {
              // Handle non-settings modules
              // Check manage first - if manage is enabled, grant all permissions for this module
            if (config.permissions.manage && (perm.action === 'manage' || permCode.endsWith(':*'))) {
                shouldGrant = true;
              } else {
                // Check individual permissions - match by action OR exact code pattern
                if (config.permissions.view && (perm.action === 'read' || permCode === `${moduleCodeLower}:read`)) {
                shouldGrant = true;
              } else if (config.permissions.create && (perm.action === 'create' || permCode === `${moduleCodeLower}:create`)) {
                shouldGrant = true;
            } else if (config.permissions.update && (perm.action === 'update' || permCode === `${moduleCodeLower}:update`)) {
                shouldGrant = true;
              } else if (config.permissions.delete && (perm.action === 'delete' || permCode === `${moduleCodeLower}:delete`)) {
                shouldGrant = true;
              } else if (config.permissions.import && (perm.action === 'import' || permCode === `${moduleCodeLower}:import`)) {
                shouldGrant = true;
              } else if (config.permissions.export && (perm.action === 'export' || permCode === `${moduleCodeLower}:export`)) {
                shouldGrant = true;
              } else if (config.permissions.manage_labels && (perm.action === 'manage_labels' || permCode === `${moduleCodeLower}:manage_labels`)) {
                shouldGrant = true;
              } else if (config.permissions.duplicate && (perm.action === 'duplicate' || permCode === `${moduleCodeLower}:duplicate`)) {
                shouldGrant = true;
                }
              }
            }
          }

          // Collect permission IDs for legacy role_permissions table
          if (shouldGrant) {
              permissionIds.push(permId);
          }

          return {
            permissionId: permId,
            granted: shouldGrant,
          };
        }).filter((p): p is { permissionId: string; granted: boolean } => p !== null && !!p.permissionId);

        const fieldsPayload = (module.fields || []).map((field) => {
          const fieldConfig = config.fieldPermissions[field.fieldId] || {
            fieldId: field.fieldId,
            fieldName: field.fieldLabel || field.fieldName,
            visible: false,
            editable: false,
          };
          return {
            fieldId: field.fieldId,
            isVisible: config.enabled ? fieldConfig.visible : false,
            isEditable: config.enabled ? (fieldConfig.editable && fieldConfig.visible) : false,
          };
        });

        return {
          moduleId,
          hasAccess: config.enabled,
          dataAccess: config.enabled ? config.dataAccess : 'none',
          permissions: permissionsPayload,
          fields: fieldsPayload,
        };
        }).filter(Boolean) as Array<{
        moduleId: string;
        hasAccess: boolean;
        dataAccess: ModuleConfig['dataAccess'];
        permissions: Array<{ permissionId: string; granted: boolean }>;
        fields: Array<{ fieldId: string; isVisible: boolean; isEditable: boolean }>;
      }>;

      const uniquePermissionIds = Array.from(new Set(permissionIds));

      const response = await fetch(`/api/roles/${roleId}/permissions/module`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          modules: modulesPayload,
          permissionIds: uniquePermissionIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Save Error]', errorData);
        throw new Error(errorData.error || 'Failed to update permissions');
      }

      toast.success('Permissions updated successfully');
      hasUnsavedChangesRef.current = false;
      initialLoadDoneRef.current = false; // Allow reload after save
      
      // Preserve the currently selected module code before reloading
      const currentSelectedModuleData = modulePermissions.find(m => m.moduleId === selectedModule);
      const moduleCodeToPreserve = currentSelectedModuleData?.moduleCode;
      
      // Update URL first to ensure useEffect picks it up correctly
      if (moduleCodeToPreserve) {
        updateUrl(moduleCodeToPreserve);
      }
      
      // Reload permissions to reflect the saved changes
      // This ensures the UI shows the actual saved state from the database
      await loadRolePermissions();
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
        <LoadingSpinner label="Loading permissions..." />
      </div>
    );
  }

  const selectedModuleData = modulePermissions.find(m => m.moduleId === selectedModule);
  const selectedConfig = selectedModule ? moduleConfigs[selectedModule] : null;

  // Debug logging
  // if (process.env.NODE_ENV === 'development') {
  //   // console.log('[PermissionAssignment] Current state:', {
  //   //   selectedModule,
  //   //   selectedModuleData: selectedModuleData?.moduleName,
  //   //   hasConfig: !!selectedConfig,
  //   //   totalModules: modulePermissions.length,
  //   //   moduleIds: modulePermissions.map(m => ({ id: m.moduleId, name: m.moduleName, code: m.moduleCode }))
  //   // });
  // }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Permission Assignment</h2>
            <p className="text-sm text-muted-foreground">
              Role: <span className="font-medium">{roleName || 'Loading...'}</span>
              {selectedModuleData && (
                <> • Module: <span className="font-medium">{selectedModuleData.moduleName}</span></>
              )}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {selectedModuleData && selectedConfig && selectedModule && (
        <>
          {/* Module Permissions */}
          <Card>
            <CardHeader
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => toggleSection('modulePermissions')}
            >
              <div className="flex items-center justify-between">
                <CardTitle>Module Permissions</CardTitle>
                {expandedSections.modulePermissions ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
            </CardHeader>
            {expandedSections.modulePermissions && (
              <CardContent className="space-y-4">
                {/* Enable Access */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedConfig.enabled}
                    onChange={() => toggleModuleEnabled(selectedModule!)}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                  />
                  <label className="font-medium text-foreground">Enable Access</label>
                </div>

                {/* Granular Permissions */}
                {selectedConfig.enabled && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Granular Permissions:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedConfig.permissions.view}
                          onChange={() => togglePermission(selectedModule!, 'view')}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">View</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedConfig.permissions.create}
                          onChange={() => togglePermission(selectedModule!, 'create')}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">Create</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedConfig.permissions.update}
                          onChange={() => togglePermission(selectedModule!, 'update')}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">Edit</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedConfig.permissions.delete}
                          onChange={() => togglePermission(selectedModule!, 'delete')}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">Delete</span>
                      </label>
                      {selectedConfig.permissions.import !== undefined && (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedConfig.permissions.import}
                            onChange={() => togglePermission(selectedModule!, 'import')}
                            className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                          />
                          <span className="text-sm text-foreground">Import</span>
                        </label>
                      )}
                      {selectedConfig.permissions.export !== undefined && (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedConfig.permissions.export}
                            onChange={() => togglePermission(selectedModule!, 'export')}
                            className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                          />
                          <span className="text-sm text-foreground">Export</span>
                        </label>
                      )}
                      {selectedConfig.permissions.manage_labels !== undefined && (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedConfig.permissions.manage_labels}
                            onChange={() => togglePermission(selectedModule!, 'manage_labels')}
                            className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                          />
                          <span className="text-sm text-foreground">Manage Labels</span>
                        </label>
                      )}
                      {selectedConfig.permissions.duplicate !== undefined && (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedConfig.permissions.duplicate}
                            onChange={() => togglePermission(selectedModule!, 'duplicate')}
                            className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                          />
                          <span className="text-sm text-foreground">Duplicate</span>
                        </label>
                      )}
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedConfig.permissions.manage}
                          onChange={() => togglePermission(selectedModule!, 'manage')}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">Manage All</span>
                      </label>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Settings Submenus - Only show for Settings module */}
          {selectedModuleData.moduleCode.toLowerCase() === 'settings' && selectedConfig.settingsSubmenus && (
            <Card>
              <CardHeader
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSection('settingsSubmenus')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle>Settings Submenus</CardTitle>
                  {expandedSections.settingsSubmenus ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </CardHeader>
              {expandedSections.settingsSubmenus && (
                <CardContent className="space-y-4">
                  {Object.entries(selectedConfig.settingsSubmenus).map(([submenuKey, submenuConfig]) => {
                    const submenuLabels: Record<string, string> = {
                      'general': 'General',
                      'registration': 'Registration',
                      'notification-methods': 'Notification Methods',
                      'smtp-settings': 'SMTP Settings',
                      'custom-fields': 'Custom Fields',
                    };

                    return (
                      <div key={submenuKey} className="border border-border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={submenuConfig.enabled}
                              onChange={(e) => toggleSettingsSubmenu(selectedModule!, submenuKey, e.target.checked)}
                              className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                            />
                            <label className="font-medium text-foreground">
                              {submenuLabels[submenuKey] || submenuKey}
                            </label>
                          </div>
                        </div>
                        {submenuConfig.enabled && (
                          <div className="ml-7 space-y-2">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={submenuConfig.read}
                                onChange={() => toggleSettingsSubmenuPermission(selectedModule!, submenuKey, 'read')}
                                className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                              />
                              <span className="text-sm text-foreground">View</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={submenuConfig.update}
                                onChange={() => toggleSettingsSubmenuPermission(selectedModule!, submenuKey, 'update')}
                                className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                              />
                              <span className="text-sm text-foreground">Update</span>
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          )}

          {/* Data Permission */}
          {selectedConfig.enabled && (
            <Card>
              <CardHeader
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSection('dataPermission')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle>Data Permission</CardTitle>
                  {expandedSections.dataPermission ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </CardHeader>
              {expandedSections.dataPermission && (
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setDataAccess(selectedModule!, 'own')}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedConfig.dataAccess === 'own'
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-foreground">Own Data</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Access own data within the module.
                      </div>
                    </button>
                    <button
                      onClick={() => setDataAccess(selectedModule!, 'team')}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedConfig.dataAccess === 'team'
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-foreground">Team Data</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Access team data within the module.
                      </div>
                    </button>
                    <button
                      onClick={() => setDataAccess(selectedModule!, 'all')}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedConfig.dataAccess === 'all'
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-foreground">All Data</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Access all data within the module.
                      </div>
                    </button>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Field Level Permission */}
          {selectedConfig.enabled && (
            <Card>
              <CardHeader
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSection('fieldPermission')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle>Field Level Permission</CardTitle>
                  {expandedSections.fieldPermission ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </CardHeader>
              {expandedSections.fieldPermission && (
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Field Name
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Visibility
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Editability
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {(selectedModuleData.fields || []).length === 0 && (
                          <tr>
                            <td className="px-6 py-4 text-sm text-muted-foreground" colSpan={3}>
                              No fields available for this module.
                            </td>
                          </tr>
                        )}
                        {(selectedModuleData.fields || []).map((field) => {
                          const fieldPerm = selectedConfig.fieldPermissions[field.fieldId] || {
                            fieldId: field.fieldId,
                            fieldName: field.fieldLabel || field.fieldName,
                            visible: false,
                            editable: false,
                          };
                          return (
                            <tr key={field.fieldId}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                {field.fieldLabel || field.fieldName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <input
                                  type="checkbox"
                                  checked={fieldPerm.visible}
                                  onChange={() => toggleFieldPermission(selectedModule!, field.fieldId, 'visible')}
                                  className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <input
                                  type="checkbox"
                                  checked={fieldPerm.editable}
                                  onChange={() => toggleFieldPermission(selectedModule!, field.fieldId, 'editable')}
                                  disabled={!fieldPerm.visible}
                                  className="w-4 h-4 text-primary border-border rounded focus:ring-primary disabled:opacity-50"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}

