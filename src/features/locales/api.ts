import { adminClient } from "../../core/api/adminClient";
import type {
  LocaleResponseDto,
  CreateLocaleDto,
  UpdateLocaleDto,
} from "./types";

export const localesApi = {
  getAll: () =>
    adminClient
      .get<LocaleResponseDto[]>("/api/admin/locales")
      .then((r) => r.data),

  create: (dto: CreateLocaleDto) =>
    adminClient
      .post<LocaleResponseDto>("/api/admin/locales", dto)
      .then((r) => r.data),

  update: (id: string, dto: UpdateLocaleDto) =>
    adminClient
      .put<LocaleResponseDto>(`/api/admin/locales/${id}`, dto)
      .then((r) => r.data),

  delete: (id: string) => adminClient.delete(`/api/admin/locales/${id}`),
};
