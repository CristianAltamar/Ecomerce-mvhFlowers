'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';

/**
 * Restores the user session on app mount using the persisted refreshToken.
 * Must be a client component inside the React tree (not in server layout).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    // Read from getState() to get the hydrated localStorage value
    const { refreshToken, refreshSession } = useAuthStore.getState();
    if (refreshToken) {
      void refreshSession();
    }
  }, []);

  return <>{children}</>;
}
