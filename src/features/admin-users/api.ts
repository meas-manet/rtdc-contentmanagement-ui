import { adminClient } from "../../core/api/adminClient";
import type {
  AdminUserResponseDto,
  CreateAdminUserDto,
  UpdateAdminUserDto,
} from "./types";

export const adminUsersApi = {
  getAll: () =>
    adminClient
      .get<AdminUserResponseDto[]>("/api/admin/users")
      .then((r) => r.data),

  getById: (id: string) =>
    adminClient
      .get<AdminUserResponseDto>(`/api/admin/users/${id}`)
      .then((r) => r.data),

  create: (dto: CreateAdminUserDto) =>
    adminClient
      .post<AdminUserResponseDto>("/api/admin/users", dto)
      .then((r) => r.data),

  update: (id: string, dto: UpdateAdminUserDto) =>
    adminClient
      .put<AdminUserResponseDto>(`/api/admin/users/${id}`, dto)
      .then((r) => r.data),

  delete: (id: string) => adminClient.delete(`/api/admin/users/${id}`),
};
