import { create } from "zustand";
import type { AuthUser } from "@/api/auth";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  patchUser: (patch: Partial<AuthUser>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  patchUser: (patch) => {
    const current = get().user;
    if (!current) return;
    set({ user: { ...current, ...patch } });
  },
  setLoading: (isLoading) => set({ isLoading }),
}));
