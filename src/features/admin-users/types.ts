// ── Admin User DTOs ────────────────────────────────────────────────────────────
export interface AdminUserResponseDto {
  id: string;
  username: string;
  email: string;
  isActive: boolean;
  roleId: string;
  roleName: string;
  websiteId: string | null;
  websiteName: string | null;
  createdAt: string;
}

export interface CreateAdminUserDto {
  username: string;
  email: string;
  password: string;
  roleId: string;
  websiteId: string | null;
}

export interface UpdateAdminUserDto {
  username: string;
  email: string;
  password?: string;
  roleId: string;
  websiteId: string | null;
  isActive: boolean;
}
