import { create } from "zustand";

import { loginRequest, meRequest, registerRequest } from "../api/auth";
import type { AuthUser } from "../types/auth";
import { getErrorMessage } from "../utils/errors";

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  register: (payload: { email: string; password: string; full_name: string }) => Promise<boolean>;
  login: (payload: { email: string; password: string }) => Promise<boolean>;
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
      return true;
    } catch (error: any) {
      set({ error: getErrorMessage(error, "No fue posible registrarme"), loading: false });
      return false;
    }
  },

  login: async (payload) => {
    set({ loading: true, error: null });
    try {
      const data = await loginRequest(payload);
      localStorage.setItem("token", data.access_token);
      const me = await meRequest();
      set({ user: me, token: data.access_token, isAuthenticated: true, loading: false });
      return true;
    } catch (error: any) {
      set({ error: getErrorMessage(error, "Credenciales inválidas"), loading: false });
      return false;
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
