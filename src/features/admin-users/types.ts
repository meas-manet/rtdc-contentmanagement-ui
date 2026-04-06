// ── Admin User DTOs ────────────────────────────────────────────────────────────
export interface AdminUserResponseDto {
  id: string;
  username: string;
  email: string;
  isActive: boolean;
  roleId: string;
  roleName: string;
  createdAt: string;
}

export interface CreateAdminUserDto {
  username: string;
  email: string;
  password: string;
  roleId: string;
}

export interface UpdateAdminUserDto {
  username: string;
  email: string;
  password?: string;
  roleId: string;
  isActive: boolean;
}
