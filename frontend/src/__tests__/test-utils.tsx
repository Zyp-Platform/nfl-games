/**
 * Test Utilities for NFL Games Frontend
 *
 * Provides wrapped render function with all necessary providers
 *
 * Usage:
 * ```tsx
 * import { render, screen, fireEvent } from '../__tests__/test-utils'
 *
 * test('my test', () => {
 *   render(<GameComponent />)
 *   expect(screen.getByText('...')).toBeInTheDocument()
 * })
 * ```
 */

/* eslint-disable react-refresh/only-export-components */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a fresh QueryClient for each test
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

interface AllProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

function AllProviders({ children, queryClient }: AllProvidersProps) {
  const client = queryClient || createTestQueryClient();

  return (
    <BrowserRouter>
      <QueryClientProvider client={client}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { queryClient, ...renderOptions } = options || {};

  return render(ui, {
    wrapper: ({ children }) => <AllProviders queryClient={queryClient}>{children}</AllProviders>,
    ...renderOptions
  });
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { customRender as render };
