import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const condition = false;
    expect(cn('foo', condition && 'bar', 'baz')).toBe('foo baz');
  });

  it('merges tailwind classes correctly', () => {
    // twMerge should handle conflicting Tailwind classes
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles undefined and null values', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('handles empty input', () => {
    expect(cn()).toBe('');
  });

  it('handles arrays of classes', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });
});
