import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/core/store/authStore';
import { useModules } from '@/core/hooks/useModules';

export interface CartLabel {
  id: string;
  moduleId: string;
  tenantId: string;
  name: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useCartLabels() {
  const [labels, setLabels] = useState<CartLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const { accessToken } = useAuthStore();
  const { findModuleByCode, loading: modulesLoading, modules } = useModules();

  const module = useMemo(() => findModuleByCode('carts'), [findModuleByCode]);
  const moduleId = useMemo(() => module?.id, [module]);

  useEffect(() => {
    if (!accessToken || modulesLoading || !moduleId) return;

    const fetchLabels = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/modules/labels?moduleId=${moduleId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to load labels');
        }

        const data = await res.json();
        if (data.success) {
          setLabels(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching cart labels:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLabels();
  }, [accessToken, modulesLoading, moduleId]);

  const refetch = async () => {
    if (!accessToken) return;
    const module = findModuleByCode('carts');
    if (!module) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/modules/labels?moduleId=${module.id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load labels');
      }

      const data = await res.json();
      if (data.success) {
        setLabels(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching cart labels:', error);
    } finally {
      setLoading(false);
    }
  };

  return { labels, loading, refetch };
}

