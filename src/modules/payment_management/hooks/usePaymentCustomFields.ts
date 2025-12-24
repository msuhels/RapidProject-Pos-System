import { useState, useEffect } from 'react';
import { useAuthStore } from '@/core/store/authStore';
import { useModules } from '@/core/hooks/useModules';
import {
  useCustomFieldsStore,
  type CustomFieldDefinition,
} from '@/core/store/customFieldsStore';

export type { CustomFieldDefinition };

const MODULE_CODE = 'payment_management';

// Track ongoing fetch promises to avoid duplicate requests
let fetchPromise: Promise<CustomFieldDefinition[]> | null = null;

export function usePaymentCustomFields() {
  const { accessToken } = useAuthStore();
  const { findModuleByCode, loading: modulesLoading } = useModules();

  const {
    getCustomFields,
    setCustomFields,
    setLoading,
    isLoading,
    shouldRefetch,
  } = useCustomFieldsStore();

  const cachedFields = getCustomFields(MODULE_CODE);
  const [customFields, setLocalFields] = useState<CustomFieldDefinition[]>(cachedFields || []);
  const loading = isLoading(MODULE_CODE);

  useEffect(() => {
    if (!accessToken || modulesLoading) return;

    // If we have cached data and it's still fresh, use it
    if (cachedFields && !shouldRefetch(MODULE_CODE)) {
      setLocalFields(cachedFields);
      return;
    }

    // If a fetch is already in progress, wait for it
    if (fetchPromise) {
      fetchPromise.then((fields) => {
        setLocalFields(fields);
      });
      return;
    }

    const fetchCustomFields = async () => {
      setLoading(MODULE_CODE, true);
      try {
        const module = findModuleByCode(MODULE_CODE);
        if (!module) {
          console.warn(`Module ${MODULE_CODE} not found`);
          setLocalFields([]);
          return;
        }

        const res = await fetch(`/api/settings/custom-fields?moduleId=${module.id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch custom fields');
        }

        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCustomFields(MODULE_CODE, data.data);
          setLocalFields(data.data);
          return data.data;
        }

        setLocalFields([]);
        return [];
      } catch (error) {
        console.error('Error fetching custom fields:', error);
        setLocalFields([]);
        return [];
      } finally {
        setLoading(MODULE_CODE, false);
        fetchPromise = null;
      }
    };

    fetchPromise = fetchCustomFields();
  }, [accessToken, modulesLoading, findModuleByCode, cachedFields, shouldRefetch, setLoading, setCustomFields]);

  return { customFields, loading };
}

