// Module registry and auto-discovery

import { loadAllModules } from '@/core/lib/moduleLoader';
import type { ModuleConfig, ModuleNavigation } from '@/core/types/module';
import type { LoadedModule } from '@/core/types/module';

class ModuleRegistry {
  private modules: Map<string, LoadedModule> = new Map();
  private initialized = false;

  /**
   * Initialize the registry by loading all modules
   */
  initialize(force = false): void {
    if (this.initialized && !force) {
      return;
    }

    // Clear existing modules if forcing re-initialization
    if (force) {
      this.modules.clear();
      this.initialized = false;
    }

    const loadedModules = loadAllModules();
    console.log(`[ModuleRegistry] Discovered ${loadedModules.length} module(s):`, loadedModules.map(m => m.id));
    
    for (const module of loadedModules) {
      this.modules.set(module.id, module);
      console.log(`[ModuleRegistry] Registered module: ${module.id} (enabled: ${module.config.enabled !== false}, hasNavigation: ${!!module.config.navigation})`);
    }

    this.initialized = true;
    console.log(`[ModuleRegistry] Loaded ${this.modules.size} module(s)`);
  }

  /**
   * Get all registered modules
   */
  getAllModules(): LoadedModule[] {
    if (!this.initialized) {
      this.initialize();
    }
    return Array.from(this.modules.values());
  }

  /**
   * Get a specific module by ID
   */
  getModule(moduleId: string): LoadedModule | undefined {
    if (!this.initialized) {
      this.initialize();
    }
    return this.modules.get(moduleId);
  }

  /**
   * Get all navigation items from registered modules (only enabled modules)
   */
  getNavigationItems(): ModuleNavigation[] {
    if (!this.initialized) {
      this.initialize();
    }

    const navItems = Array.from(this.modules.values())
      .filter((module) => module.config.enabled !== false) // Only enabled modules
      .map((module) => module.config.navigation)
      .filter((nav): nav is ModuleNavigation => nav !== undefined)
      .sort((a, b) => (a.order || 999) - (b.order || 999));

    return navItems;
  }

  /**
   * Get all routes from registered modules (only enabled modules)
   */
  getAllRoutes(): Array<{ moduleId: string; route: any }> {
    if (!this.initialized) {
      this.initialize();
    }

    const allRoutes: Array<{ moduleId: string; route: any }> = [];
    
    for (const module of this.modules.values()) {
      // Skip disabled modules
      if (module.config.enabled === false) {
        continue;
      }
      
      if (module.config.routes) {
        for (const route of module.config.routes) {
          allRoutes.push({ moduleId: module.id, route });
        }
      }
    }

    return allRoutes;
  }

  /**
   * Get API endpoints for a specific module (only if enabled)
   */
  getModuleApiEndpoints(moduleId: string) {
    const module = this.getModule(moduleId);
    // Return empty array if module is disabled
    if (!module || module.config.enabled === false) {
      return [];
    }
    return module.config.api?.endpoints || [];
  }

  /**
   * Get all API endpoints from all modules (only enabled modules)
   */
  getAllApiEndpoints(): Array<{ moduleId: string; basePath: string; endpoint: any }> {
    if (!this.initialized) {
      this.initialize();
    }

    const allEndpoints: Array<{ moduleId: string; basePath: string; endpoint: any }> = [];
    
    for (const module of this.modules.values()) {
      // Skip disabled modules
      if (module.config.enabled === false) {
        continue;
      }
      
      if (module.config.api) {
        for (const endpoint of module.config.api.endpoints) {
          allEndpoints.push({
            moduleId: module.id,
            basePath: module.config.api.basePath,
            endpoint,
          });
        }
      }
    }

    return allEndpoints;
  }
}

// Singleton instance
export const moduleRegistry = new ModuleRegistry();

// Initialize on import (server-side only)
if (typeof window === 'undefined') {
  moduleRegistry.initialize();
}
