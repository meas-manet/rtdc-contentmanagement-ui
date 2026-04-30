import { adminClient } from "../../core/api/adminClient";
import type { RoleResponseDto, CreateRoleDto, UpdateRoleDto } from "./types";

export const rolesApi = {
  getAll: (websiteId?: string | null) =>
    adminClient
      .get<RoleResponseDto[]>("/api/admin/roles", {
        params: websiteId ? { websiteId } : undefined,
      })
      .then((r) => r.data),

  getById: (id: string) =>
    adminClient
      .get<RoleResponseDto>(`/api/admin/roles/${id}`)
      .then((r) => r.data),

  create: (dto: CreateRoleDto) =>
    adminClient
      .post<RoleResponseDto>("/api/admin/roles", dto)
      .then((r) => r.data),

  update: (id: string, dto: UpdateRoleDto) =>
    adminClient
      .put<RoleResponseDto>(`/api/admin/roles/${id}`, dto)
      .then((r) => r.data),

  delete: (id: string) => adminClient.delete(`/api/admin/roles/${id}`),
};
