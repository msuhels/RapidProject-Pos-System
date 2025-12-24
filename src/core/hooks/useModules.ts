import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/core/store/authStore';

interface Module {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

// Global cache to avoid refetching
let modulesCache: Module[] | null = null;
let modulesCachePromise: Promise<Module[]> | null = null;

export function useModules() {
  const [modules, setModules] = useState<Module[]>(modulesCache || []);
  const [loading, setLoading] = useState(!modulesCache);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) return;

    // If we already have cached data, use it immediately
    if (modulesCache) {
      setModules(modulesCache);
      setLoading(false);
      return;
    }

    // If a fetch is already in progress, reuse that promise
    if (modulesCachePromise) {
      modulesCachePromise.then((data) => {
        setModules(data);
        setLoading(false);
      });
      return;
    }

    const fetchModules = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/modules', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to load modules');
        }

        const data = await res.json();
        const modulesList = data.modules || [];
        
        // Cache the result
        modulesCache = modulesList;
        setModules(modulesList);
        
        return modulesList;
      } catch (error) {
        console.error('Error fetching modules:', error);
        return [];
      } finally {
        setLoading(false);
        modulesCachePromise = null;
      }
    };

    modulesCachePromise = fetchModules();
  }, [accessToken]);

  const findModuleByCode = useCallback((code: string) => {
    return modules.find((m) => m.code === code || m.code === code.toUpperCase() || m.code === code.toLowerCase());
  }, [modules]);

  const clearCache = () => {
    modulesCache = null;
    modulesCachePromise = null;
  };

  return { modules, loading, findModuleByCode, clearCache };
}
