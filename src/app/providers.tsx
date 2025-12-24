'use client';

import { ThemeProvider } from '@/core/components/common/ThemeProvider';

/**
 * App-level providers wrapper
 * Wraps the application with all necessary providers
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
