/**
 * Basic example hook for the template module.
 *
 * Copy and adapt this hook when creating a new module.
 */

import { useState } from 'react';

export interface TemplateRecord {
  id: string;
  name: string;
  description?: string;
}

export function useTemplateRecord(initial?: TemplateRecord) {
  const [record, setRecord] = useState<TemplateRecord | undefined>(initial);

  return {
    record,
    setRecord,
  };
}


