import { create } from "zustand";

import { loginRequest, meRequest, registerRequest } from "../api/auth";
import type { AuthUser } from "../types/auth";

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  register: (payload: { email: string; password: string; full_name: string }) => Promise<void>;
  login: (payload: { email: string; password: string }) => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: Boolean(localStorage.getItem("token")),
  loading: false,
  error: null,

  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      await registerRequest(payload);
      const loginData = await loginRequest({ email: payload.email, password: payload.password });
      localStorage.setItem("token", loginData.access_token);
      const me = await meRequest();
      set({ user: me, token: loginData.access_token, isAuthenticated: true, loading: false });
    } catch (error: any) {
      set({ error: error?.response?.data?.detail || "No fue posible registrarme", loading: false });
    }
  },

  login: async (payload) => {
    set({ loading: true, error: null });
    try {
      const data = await loginRequest(payload);
      localStorage.setItem("token", data.access_token);
      const me = await meRequest();
      set({ user: me, token: data.access_token, isAuthenticated: true, loading: false });
    } catch (error: any) {
      set({ error: error?.response?.data?.detail || "Credenciales inválidas", loading: false });
    }
  },

  fetchMe: async () => {
    if (!localStorage.getItem("token")) return;
    try {
      const me = await meRequest();
      set({ user: me, isAuthenticated: true });
    } catch {
      localStorage.removeItem("token");
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null, isAuthenticated: false, error: null });
  }
}));
