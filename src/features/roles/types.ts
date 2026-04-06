// ── Permissions ────────────────────────────────────────────────────────────────
export interface ModulePermissionsDto {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  publish: boolean;
}

export const EMPTY_PERMISSIONS: ModulePermissionsDto = {
  create: false,
  read: false,
  update: false,
  delete: false,
  publish: false,
};

// Canonical modules exposed in the permission matrix
export const PERMISSION_MODULES = [
  { key: "content", label: "Content" },
  { key: "media", label: "Media" },
  { key: "schemas", label: "Schemas" },
  { key: "websites", label: "Websites" },
  { key: "users", label: "Admin Users" },
  { key: "translations", label: "Translations" },
  { key: "roles", label: "Roles" },
  { key: "settings", label: "Settings" },
] as const;

export type ModuleKey = (typeof PERMISSION_MODULES)[number]["key"];

// ── Role DTOs ─────────────────────────────────────────────────────────────────
export interface RoleResponseDto {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions: Record<string, ModulePermissionsDto>;
  createdAt: string;
  userCount: number;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissions: Record<string, ModulePermissionsDto>;
}

export interface UpdateRoleDto {
  name: string;
  description?: string;
  permissions: Record<string, ModulePermissionsDto>;
}
