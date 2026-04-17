import { api } from "./client";
import type { ManagedRole, ManagedUser, UsersListResponse } from "../types/user";

export const listUsersRequest = async (): Promise<UsersListResponse> => {
  const { data } = await api.get<UsersListResponse>("/users");
  return data;
};

export const updateUserRoleRequest = async (userId: string, role: ManagedRole): Promise<ManagedUser> => {
  const { data } = await api.patch<ManagedUser>(`/users/${userId}/role`, { role });
  return data;
};

export const updateMyProfileRequest = async (payload: {
  full_name?: string;
  current_password?: string;
  new_password?: string;
}): Promise<ManagedUser> => {
  const { data } = await api.patch<ManagedUser>("/users/me", payload);
  return data;
};
