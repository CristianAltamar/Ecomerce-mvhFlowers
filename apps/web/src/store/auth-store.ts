'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PublicUser } from '@mvh/types';
import { apiFetch } from '@/lib/api-client';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface AuthApiResponse {
  user: PublicUser;
  tokens: { accessToken: string; refreshToken: string; expiresIn: number };
}

interface AuthState {
  user: PublicUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      login: async (email, password) => {
        const res = await apiFetch<AuthApiResponse>('/auth/login', {
          method: 'POST',
          body: { email, password },
        });
        set({
          user: res.user,
          accessToken: res.tokens.accessToken,
          refreshToken: res.tokens.refreshToken,
        });
      },

      register: async (data) => {
        const res = await apiFetch<AuthApiResponse>('/auth/register', {
          method: 'POST',
          body: data,
        });
        set({
          user: res.user,
          accessToken: res.tokens.accessToken,
          refreshToken: res.tokens.refreshToken,
        });
      },

      logout: async () => {
        const { refreshToken } = get();
        if (refreshToken) {
          try {
            await apiFetch('/auth/logout', { method: 'POST', body: { refreshToken } });
          } catch {
            // ignore — clear local state regardless
          }
        }
        set({ user: null, accessToken: null, refreshToken: null });
      },

      refreshSession: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;
        try {
          set({ isLoading: true });
          const res = await apiFetch<AuthApiResponse>('/auth/refresh', {
            method: 'POST',
            body: { refreshToken },
          });
          set({
            user: res.user,
            accessToken: res.tokens.accessToken,
            refreshToken: res.tokens.refreshToken,
            isLoading: false,
          });
          return true;
        } catch {
          set({ user: null, accessToken: null, refreshToken: null, isLoading: false });
          return false;
        }
      },
    }),
    {
      name: 'mvh-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist refreshToken — accessToken stays in memory for security
      partialize: (state) => ({ refreshToken: state.refreshToken }),
    },
  ),
);
