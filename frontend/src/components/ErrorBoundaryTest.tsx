import { useState } from 'react';

/**
 * Test component to verify ErrorBoundary functionality
 * This component can be used to intentionally trigger errors
 *
 * Usage:
 * 1. Import this component in any page
 * 2. Render it: <ErrorBoundaryTest />
 * 3. Click the button to trigger an error
 * 4. Verify that the ErrorBoundary catches it and shows fallback UI
 */

interface Props {
  onError?: (error: Error) => void;
}

export function ErrorBoundaryTest({ onError }: Props = {}) {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    // Intentionally throw an error to test error boundary
    const error = new Error(
      'Test error: This is an intentional error to verify ErrorBoundary functionality'
    );
    onError?.(error);
    throw error;
  }

  return (
    <div className="p-4 border-2 border-dashed border-yellow-500 rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <h3 className="font-bold text-yellow-800 dark:text-yellow-200">
              Error Boundary Test Component
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              This component is for testing error boundaries. Click the button below to trigger an
              intentional error.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShouldThrow(true)}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Trigger Error (Test Error Boundary)
        </button>

        <p className="text-xs text-yellow-600 dark:text-yellow-400">
          💡 After clicking, you should see the ErrorBoundary fallback UI instead of a white screen.
        </p>
      </div>
    </div>
  );
}

/**
 * Example usage in a page component:
 *
 * ```tsx
 * import { ErrorBoundaryTest } from '../components/ErrorBoundaryTest';
 *
 * export function MyPage() {
 *   return (
 *     <div>
 *       {import.meta.env.DEV && <ErrorBoundaryTest />}
 *       // ... rest of page content
 *     </div>
 *   );
 * }
 * ```
 */
