import React from 'react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen } from '../../__tests__/test-utils';
import { ErrorBoundary } from '../ErrorBoundary';

// Component that throws an error for testing
function ThrowError({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Normal content</div>;
}

describe('ErrorBoundary', () => {
  // Suppress console.error for error boundary tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('shows reload button in error state', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /Reload Page/i })).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error fallback</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error fallback')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('shows generic message when error has no message', () => {
    // Create error without message
    function ThrowErrorNoMessage(): React.ReactElement {
      // Create error without message by throwing an object
      throw { name: 'Error' };
    }

    render(
      <ErrorBoundary>
        <ThrowErrorNoMessage />
      </ErrorBoundary>
    );

    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
  });

  it('reloads page when reload button is clicked', () => {
    // Mock window.location.reload
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { reload: reloadMock },
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByRole('button', { name: /Reload Page/i });
    reloadButton.click();

    expect(reloadMock).toHaveBeenCalled();
  });

  it('logs error to console when error is caught', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
