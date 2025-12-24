'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/core/lib/utils';
import * as LucideIcons from 'lucide-react';
import type { ModuleNavigation } from '@/core/types/module';
import { useAuthStore } from '@/core/store/authStore';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

// Static navigation items are now loaded from API and filtered by permissions

// Helper to get icon component from string name
function getIconComponent(iconName?: string): React.ReactNode {
  if (!iconName) return null;
  
  // Convert PascalCase to match lucide-react exports
  const IconComponent = (LucideIcons as any)[iconName];
  if (IconComponent) {
    return <IconComponent className="w-5 h-5" />;
  }
  
  // Fallback to FileText if icon not found
  return <LucideIcons.FileText className="w-5 h-5" />;
}

interface SidebarProps {
  onNavigationLoaded?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ onNavigationLoaded, isOpen = false, onClose }: SidebarProps = {}) {
  const pathname = usePathname();
  const [moduleNavItems, setModuleNavItems] = useState<NavItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const { isAuthenticated, _hasHydrated, token } = useAuthStore();

  // Helper to check if user has permission (supports wildcards)
  const hasPermission = (permissionCode: string): boolean => {
    if (userPermissions.length === 0) return false;
    if (userPermissions.includes(permissionCode)) return true;
    const module = permissionCode.split(':')[0];
    const wildcardPermission = `${module}:*`;
    if (userPermissions.includes(wildcardPermission)) return true;
    if (userPermissions.includes('admin:*')) return true;
    return false;
  };

  // Core Settings section (shown when inside /settings routes) - filtered by permissions
  const getAllSettingsNavItems = (): NavItem[] => {
    const items: NavItem[] = [
      {
        label: 'Back to Main Menu',
        href: '/dashboard',
        icon: <LucideIcons.ArrowLeft className="w-5 h-5" />,
      },
    ];

    // Only show submenus if user has the corresponding explicit read permission
    // We check for specific submenu permissions, not the wildcard, to respect granular control
    if (hasPermission('settings:general:read')) {
      items.push({
        label: 'General',
        href: '/settings/general',
        icon: <LucideIcons.FileText className="w-5 h-5" />,
      });
    }

    if (hasPermission('settings:registration:read')) {
      items.push({
        label: 'Registration',
        href: '/settings/registration',
        icon: <LucideIcons.UserPlus className="w-5 h-5" />,
      });
    }

    if (hasPermission('settings:notification-methods:read')) {
      items.push({
        label: 'Notification Methods',
        href: '/settings/notification-methods',
        icon: <LucideIcons.Bell className="w-5 h-5" />,
      });
    }

    if (hasPermission('settings:smtp-settings:read')) {
      items.push({
        label: 'SMTP Settings',
        href: '/settings/smtp-settings',
        icon: <LucideIcons.Mail className="w-5 h-5" />,
      });
    }

    if (hasPermission('settings:custom-fields:read')) {
      items.push({
        label: 'Custom Fields',
        href: '/settings/custom-fields',
        icon: <LucideIcons.SlidersHorizontal className="w-5 h-5" />,
      });
    }

    return items;
  };

  useEffect(() => {
    // Wait for hydration to complete
    if (!_hasHydrated) {
      setIsLoading(true);
      // Set a fallback timeout for hydration
      const hydrationTimeout = setTimeout(() => {
        console.error('[Sidebar] Hydration timeout - forcing load');
        setIsLoading(false);
        // Small delay to ensure state updates are applied before hiding skeleton
        setTimeout(() => {
        onNavigationLoaded?.();
        }, 50);
      }, 3000);
      return () => clearTimeout(hydrationTimeout);
    }

    if (!isAuthenticated) {
      console.log('[Sidebar] User not authenticated, skipping navigation load');
      setIsLoading(false);
      setModuleNavItems([]);
      // Small delay to ensure state updates are applied before hiding skeleton
      setTimeout(() => {
      onNavigationLoaded?.();
      }, 50);
      return;
    }

    setIsLoading(true);

    // Load module navigation items from API (filtered by user permissions)
    // Try both Bearer token (from store) and cookies
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Set a timeout to ensure we don't hang forever
    const timeoutId = setTimeout(() => {
      console.error('[Sidebar] Navigation loading timeout after 10 seconds');
      setModuleNavItems([]);
      setIsLoading(false);
      // Small delay to ensure state updates are applied before hiding skeleton
      setTimeout(() => {
      onNavigationLoaded?.();
      }, 50);
    }, 10000);

    // Load navigation and permissions in parallel
    Promise.all([
      fetch('/api/modules/navigation', {
        headers,
        credentials: 'include',
        cache: 'no-store',
      }),
      fetch('/api/auth/permissions', {
        headers,
        credentials: 'include',
        cache: 'no-store',
      }),
    ])
      .then(async ([navRes, permRes]) => {
        clearTimeout(timeoutId);
        
        // Handle navigation
        if (!navRes.ok) {
          throw new Error(`HTTP error! status: ${navRes.status}`);
        }
        const navData = await navRes.json();
        
        // Handle permissions
        let permissions: string[] = [];
        if (permRes.ok) {
          const permData = await permRes.json();
          permissions = permData.permissions || [];
        }
        setUserPermissions(permissions);

        if (navData.success && navData.navigation) {
          const items: NavItem[] = navData.navigation.map((nav: ModuleNavigation) => ({
            label: nav.label,
            href: nav.path,
            icon: getIconComponent(nav.icon),
          }));
          setModuleNavItems(items);
        } else {
          console.warn('[Sidebar] Navigation API returned no navigation items:', navData);
          setModuleNavItems([]);
        }
        setIsLoading(false);
        setTimeout(() => {
          onNavigationLoaded?.();
        }, 50);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error('[Sidebar] Failed to load navigation or permissions:', err);
        setModuleNavItems([]);
        setUserPermissions([]);
        setIsLoading(false);
        setTimeout(() => {
          onNavigationLoaded?.();
        }, 50);
      });
  }, [isAuthenticated, _hasHydrated, token, onNavigationLoaded]);

  const inSettingsSection = pathname?.startsWith('/settings');

  // All navigation items (static + dynamic) come from API, filtered by permissions
  // The API now returns both static items (Dashboard, Profile, etc.) and dynamic modules
  // Check if Settings is already in the API response to avoid duplicates
  const hasSettingsInNav = moduleNavItems.some(item => 
    item.href.startsWith('/settings') || item.label.toLowerCase() === 'settings'
  );

  const mainNavItems: NavItem[] = [
    ...moduleNavItems,
    // Only add Settings manually if it's not already in the API response and user has permission
    ...(!hasSettingsInNav && (hasPermission('settings:read') || hasPermission('settings:*')) ? [{
      label: 'Settings',
      href: '/settings/general',
      icon: <LucideIcons.Settings className="w-5 h-5" />,
    }] : []),
  ];

  const settingsNavItems = getAllSettingsNavItems();
  const navItemsToRender = inSettingsSection ? settingsNavItems : mainNavItems;

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 w-64 h-screen flex flex-col border-r border-sidebar-border z-50 transition-transform duration-300 ease-in-out",
        "bg-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar/90 shadow-lg",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="px-6 pt-5 pb-4 flex-shrink-0 flex items-center justify-between border-b border-sidebar-border/70">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-xs font-semibold text-sidebar-primary-foreground shadow-sm">
            RF
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              RAD Framework
            </span>
            <span className="text-xs text-sidebar-foreground/70">
              Admin Console
            </span>
          </div>
        </div>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-md hover:bg-sidebar-accent transition-colors"
          aria-label="Close sidebar"
        >
          <LucideIcons.X className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-4 pb-6 pt-3 space-y-1">
        <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-sidebar-foreground/60">
          {inSettingsSection ? 'Settings' : 'Navigation'}
        </p>
        {isLoading ? (
          // Show skeleton placeholders while loading (matches DashboardSkeleton)
          <>
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 px-4 py-2 rounded-md"
              >
                <div className="w-5 h-5 bg-sidebar-accent/30 rounded animate-pulse"></div>
                <div className="h-4 bg-sidebar-accent/30 rounded animate-pulse flex-1"></div>
              </div>
            ))}
          </>
        ) : navItemsToRender.length === 0 ? (
          <div className="text-muted-foreground text-sm py-4">
            No navigation items available.
            {!isAuthenticated && <div className="mt-2">Please log in.</div>}
          </div>
        ) : (
          navItemsToRender.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose?.()}
              className={cn(
                'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground'
              )}
            >
              <span className="flex items-center justify-center rounded-md bg-sidebar-accent/20 text-sidebar-foreground group-hover:bg-sidebar-accent/30 group-hover:text-sidebar-accent-foreground h-8 w-8">
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
          })
        )}
      </nav>
    </aside>
  );
}
