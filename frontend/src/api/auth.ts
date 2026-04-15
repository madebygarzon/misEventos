import { api } from "./client";
import type { AuthUser, LoginResponse } from "../types/auth";

export const registerRequest = async (payload: {
  email: string;
  password: string;
  full_name: string;
}): Promise<AuthUser> => {
  const { data } = await api.post<AuthUser>("/auth/register", payload);
  return data;
};

export const loginRequest = async (payload: {
  email: string;
  password: string;
}): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>("/auth/login", payload);
  return data;
};

export const meRequest = async (): Promise<AuthUser> => {
  const { data } = await api.get<AuthUser>("/auth/me");
  return data;
};
