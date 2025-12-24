'use client';

/**
 * Global Error Handler
 * This file handles errors at the root level of the application
 * Must be a client component and include <html> and <body> tags
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>
            Something went wrong!
          </h2>
          {error.message && (
            <p style={{ color: '#666', marginBottom: '24px' }}>
              {error.message}
            </p>
          )}
          <button
            onClick={() => reset()}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

