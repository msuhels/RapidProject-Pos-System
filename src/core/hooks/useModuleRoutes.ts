// Module routes hook

import { useEffect, useState } from 'react';
import type { ModuleRoute } from '@/core/types/module';

export function useModuleRoutes() {
  const [routes, setRoutes] = useState<Array<{ moduleId: string; route: ModuleRoute }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/modules/routes')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.routes) {
          setRoutes(data.routes);
        }
      })
      .catch((err) => {
        console.error('Failed to load module routes:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { routes, loading };
}
