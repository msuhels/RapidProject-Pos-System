// Universal dynamic module routes handler

import { notFound } from 'next/navigation';
import { moduleRegistry } from '@/core/config/moduleRegistry';
import { getModuleRoutePath } from '@/core/lib/moduleLoader';
import { existsSync } from 'fs';
import React from 'react';

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function DynamicModulePage({ params }: PageProps) {
  const { slug } = await params;
  const routePath = '/' + slug.join('/');

  // Force re-initialization to ensure routes are loaded
  moduleRegistry.initialize(true);

  // Get all registered routes
  const allRoutes = moduleRegistry.getAllRoutes();
  
  // Debug logging
  console.log(`[DynamicRoute] Looking for route: ${routePath}`);
  console.log(`[DynamicRoute] Available routes:`, allRoutes.map(r => ({ moduleId: r.moduleId, path: r.route.path })));

  // Find matching route
  const matchedRoute = allRoutes.find(({ route }) => {
    // Exact match
    if (route.path === routePath) {
      console.log(`[DynamicRoute] Exact match found: ${route.path}`);
      return true;
    }
    
    // Pattern match (e.g., /notes/:id)
    const routePattern = route.path.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${routePattern}$`);
    const matches = regex.test(routePath);
    if (matches) {
      console.log(`[DynamicRoute] Pattern match found: ${route.path} matches ${routePath}`);
    }
    return matches;
  });

  if (!matchedRoute) {
    console.error(`[DynamicRoute] No route found for: ${routePath}`);
    console.error(`[DynamicRoute] Available routes were:`, allRoutes.map(r => r.route.path));
    notFound();
  }

  const { moduleId, route } = matchedRoute;

  // Check if module is enabled
  const module = moduleRegistry.getModule(moduleId);
  if (!module || module.config.enabled === false) {
    notFound();
  }

  // Get the component path
  const componentPath = getModuleRoutePath(moduleId, route.component);
  if (!componentPath || !existsSync(componentPath)) {
    console.error(`Component not found: ${componentPath} for route ${route.path}`);
    notFound();
  }

  try {
    // Dynamically import the component using path alias
    // Next.js should resolve @/modules/* at build/runtime
    const modulePath = `@/modules/${moduleId}/routes/${route.component}`;
    
    console.log(`[DynamicRoute] Attempting to import: ${modulePath}`);
    console.log(`[DynamicRoute] Component file exists: ${componentPath}`);
    console.log(`[DynamicRoute] Module ID: ${moduleId}, Component: ${route.component}`);
    
    // Use dynamic import with error handling
    // For Next.js App Router, dynamic imports with path aliases should work
    let ComponentModule: any;
    try {
      // Dynamic import with path alias - Next.js should resolve this at runtime
      ComponentModule = await import(modulePath);
    } catch (importError: any) {
      console.error(`[DynamicRoute] Failed to import module at ${modulePath}:`, importError);
      console.error(`[DynamicRoute] Error details:`, {
        message: importError?.message,
        code: importError?.code,
        stack: importError?.stack,
        name: importError?.name,
      });
      notFound();
    }

    if (!ComponentModule) {
      console.error(`[DynamicRoute] Import returned null/undefined for ${modulePath}`);
      notFound();
    }

    const Component = ComponentModule.default;

    if (!Component) {
      console.error(`[DynamicRoute] No default export found in ${modulePath}`);
      console.error(`[DynamicRoute] Available exports:`, Object.keys(ComponentModule));
      notFound();
    }

    // Build params object for dynamic segments (e.g., /module/:id)
    const paramsObj: Record<string, string> = {};
    const routeSegments = route.path.split('/').filter(Boolean);
    const pathSegments = routePath.split('/').filter(Boolean);
    routeSegments.forEach((seg: string, idx: number) => {
      if (seg.startsWith(':')) {
        const key = seg.slice(1);
        paramsObj[key] = pathSegments[idx] || '';
      }
    });

    console.log(`[DynamicRoute] Successfully loaded component for ${route.path} with params`, paramsObj);
    return <Component params={paramsObj} />;
  } catch (error) {
    console.error(`[DynamicRoute] Failed to load component for route ${route.path}:`, error);
    notFound();
  }
}
