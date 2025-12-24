import { create } from 'zustand';

export interface CustomFieldDefinition {
  id: string;
  moduleId: string;
  name: string;
  code: string;
  label: string;
  fieldType: 'text' | 'number' | 'email' | 'date' | 'select' | 'textarea' | 'boolean' | 'url';
  description?: string;
  isActive: boolean;
  sortOrder: number;
  metadata?: {
    isRequired?: boolean;
    defaultValue?: string | number | boolean | null;
    showInTable?: boolean;
    isFilterable?: boolean;
    options?: string[]; // For select fields
    validation?: {
      min?: number;
      max?: number;
      pattern?: string;
      minLength?: number;
      maxLength?: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

interface CustomFieldsStore {
  // Cache for custom fields by module code
  customFieldsCache: Record<string, CustomFieldDefinition[]>;
  // Loading states by module code
  loadingStates: Record<string, boolean>;
  // Last fetch time by module code
  lastFetch: Record<string, number>;
  
  // Actions
  setCustomFields: (moduleCode: string, fields: CustomFieldDefinition[]) => void;
  getCustomFields: (moduleCode: string) => CustomFieldDefinition[] | null;
  setLoading: (moduleCode: string, loading: boolean) => void;
  isLoading: (moduleCode: string) => boolean;
  invalidateCache: (moduleCode?: string) => void;
  shouldRefetch: (moduleCode: string, ttl?: number) => boolean;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export const useCustomFieldsStore = create<CustomFieldsStore>((set, get) => ({
  customFieldsCache: {},
  loadingStates: {},
  lastFetch: {},

  setCustomFields: (moduleCode: string, fields: CustomFieldDefinition[]) => {
    set((state) => ({
      customFieldsCache: {
        ...state.customFieldsCache,
        [moduleCode]: fields,
      },
      lastFetch: {
        ...state.lastFetch,
        [moduleCode]: Date.now(),
      },
    }));
  },

  getCustomFields: (moduleCode: string) => {
    return get().customFieldsCache[moduleCode] || null;
  },

  setLoading: (moduleCode: string, loading: boolean) => {
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        [moduleCode]: loading,
      },
    }));
  },

  isLoading: (moduleCode: string) => {
    return get().loadingStates[moduleCode] || false;
  },

  invalidateCache: (moduleCode?: string) => {
    if (moduleCode) {
      // Invalidate specific module by setting lastFetch to 0
      // This will trigger a refetch on next access
      set((state) => {
        const newCache = { ...state.customFieldsCache };
        const newLastFetch = { ...state.lastFetch };
        delete newCache[moduleCode];
        delete newLastFetch[moduleCode];
        return {
          customFieldsCache: newCache,
          lastFetch: newLastFetch,
        };
      });
    } else {
      // Invalidate all caches
      set({
        customFieldsCache: {},
        lastFetch: {},
      });
    }
  },

  shouldRefetch: (moduleCode: string, ttl: number = DEFAULT_TTL) => {
    const lastFetchTime = get().lastFetch[moduleCode];
    if (!lastFetchTime) return true;
    return Date.now() - lastFetchTime > ttl;
  },
}));

