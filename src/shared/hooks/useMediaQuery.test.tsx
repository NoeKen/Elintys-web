import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMediaQuery } from './useMediaQuery';

describe('useMediaQuery', () => {
  afterEach(() => vi.restoreAllMocks());

  it('synchronise la valeur du media query sans effet de rattrapage', () => {
    let matches = false;
    const listeners = new Set<() => void>();
    vi.spyOn(window, 'matchMedia').mockImplementation(() => ({
      matches,
      media: '(max-width: 640px)',
      onchange: null,
      addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) =>
        listeners.add(listener as () => void),
      removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) =>
        listeners.delete(listener as () => void),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useMediaQuery('(max-width: 640px)'));
    expect(result.current).toBe(false);

    act(() => {
      matches = true;
      listeners.forEach((listener) => listener());
    });
    expect(result.current).toBe(true);
  });
});
