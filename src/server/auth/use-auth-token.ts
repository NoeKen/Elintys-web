'use client';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export function useAuthToken(): string {
  const ctx = useContext(AuthContext);
  return ctx?.session?.tokens?.accessToken ?? '';
}
