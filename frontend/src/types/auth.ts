export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  roles: string[];
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
};
