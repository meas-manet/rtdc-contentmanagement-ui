import { adminClient } from "../../core/api/adminClient";
import type {
  SchemaResponseDto,
  CreateSchemaDto,
  UpdateSchemaDto,
} from "./types";
import type { PagedContentResultDto } from "../entries/types";

export const schemasApi = {
  getAll: (websiteId: string) =>
    adminClient
      .get<SchemaResponseDto[]>(`/api/admin/websites/${websiteId}/schemas`)
      .then((r) => r.data),

  getById: (websiteId: string, id: string) =>
    adminClient
      .get<SchemaResponseDto>(`/api/admin/websites/${websiteId}/schemas/${id}`)
      .then((r) => r.data),

  create: (websiteId: string, dto: CreateSchemaDto) =>
    adminClient
      .post<SchemaResponseDto>(`/api/admin/websites/${websiteId}/schemas`, dto)
      .then((r) => r.data),

  update: (websiteId: string, id: string, dto: UpdateSchemaDto) =>
    adminClient
      .put<SchemaResponseDto>(
        `/api/admin/websites/${websiteId}/schemas/${id}`,
        dto,
      )
      .then((r) => r.data),

  delete: (websiteId: string, id: string) =>
    adminClient.delete(`/api/admin/websites/${websiteId}/schemas/${id}`),

  // Admin content listing — returns ALL entries (draft + published)
  getEntries: (
    websiteId: string,
    schemaId: string,
    params: {
      page?: number;
      pageSize?: number;
      locale?: string;
      status?: string;
    },
  ) =>
    adminClient
      .get<PagedContentResultDto>(
        `/api/admin/websites/${websiteId}/schemas/${schemaId}/entries`,
        { params },
      )
      .then((r) => r.data),

  // Admin delete by entry ID (JWT-authenticated, no slug/apiKey needed)
  deleteEntry: (websiteId: string, schemaId: string, entryId: string) =>
    adminClient.delete(
      `/api/admin/websites/${websiteId}/schemas/${schemaId}/entries/${entryId}`,
    ),
};
