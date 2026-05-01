import { adminClient } from "../../core/api/adminClient";
import type {
  WebsiteResponseDto,
  WebsiteSummaryDto,
  CreateWebsiteDto,
  UpdateWebsiteDto,
} from "./types";

export const websitesApi = {
  getAll: () =>
    adminClient
      .get<WebsiteResponseDto[]>("/api/admin/websites")
      .then((r) => r.data),

  getById: (id: string) =>
    adminClient
      .get<WebsiteResponseDto>(`/api/admin/websites/${id}`)
      .then((r) => r.data),

  create: (dto: CreateWebsiteDto) =>
    adminClient
      .post<WebsiteResponseDto>("/api/admin/websites", dto)
      .then((r) => r.data),

  update: (id: string, dto: UpdateWebsiteDto) =>
    adminClient
      .put<WebsiteResponseDto>(`/api/admin/websites/${id}`, dto)
      .then((r) => r.data),

  delete: (id: string) => adminClient.delete(`/api/admin/websites/${id}`),

  regenerateKey: (id: string) =>
    adminClient
      .post<{ apiKey: string }>(`/api/admin/websites/${id}/regenerate-key`)
      .then((r) => r.data),

  getSummary: (id: string) =>
    adminClient
      .get<WebsiteSummaryDto>(`/api/admin/websites/${id}/summary`)
      .then((r) => r.data),
};
