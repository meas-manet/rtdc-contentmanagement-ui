import { adminClient } from "../../core/api/adminClient";
import type {
  TranslationResponseDto,
  CreateTranslationDto,
  UpdateTranslationDto,
} from "./types";

export const translationsApi = {
  getAll: (locale?: string) =>
    adminClient
      .get<TranslationResponseDto[]>("/api/admin/translations", {
        params: locale ? { locale } : undefined,
      })
      .then((r) => r.data),

  create: (dto: CreateTranslationDto) =>
    adminClient
      .post<TranslationResponseDto>("/api/admin/translations", dto)
      .then((r) => r.data),

  update: (id: string, dto: UpdateTranslationDto) =>
    adminClient
      .put<TranslationResponseDto>(`/api/admin/translations/${id}`, dto)
      .then((r) => r.data),

  delete: (id: string) => adminClient.delete(`/api/admin/translations/${id}`),
};
