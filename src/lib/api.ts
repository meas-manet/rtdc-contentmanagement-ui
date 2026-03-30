import { adminClient, makeContentClient } from "./apiClients";
import type {
  LoginDto,
  TokenResponseDto,
  WebsiteResponseDto,
  CreateWebsiteDto,
  UpdateWebsiteDto,
  SchemaResponseDto,
  CreateSchemaDto,
  UpdateSchemaDto,
  ContentEntryResponseDto,
  PagedContentResultDto,
  CreateContentEntryDto,
  UpdateContentEntryDto,
  CreateLocalizationDto,
  MediaAssetResponseDto,
  MediaFolderResponseDto,
  CreateMediaFolderDto,
  RenameMediaFolderDto,
  MoveMediaAssetDto,
  TranslationResponseDto,
  CreateTranslationDto,
  UpdateTranslationDto,
  LocaleResponseDto,
  CreateLocaleDto,
  UpdateLocaleDto,
} from "./types";

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (dto: LoginDto) =>
    adminClient
      .post<TokenResponseDto>("/api/auth/login", dto)
      .then((r) => r.data),
};

// ── Websites ──────────────────────────────────────────────────────────────────
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
};

// ── Schemas ───────────────────────────────────────────────────────────────────
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

// ── Content ───────────────────────────────────────────────────────────────────
export const contentApi = {
  getEntries: (
    siteSlug: string,
    schemaSlug: string,
    apiKey: string,
    params: {
      page?: number;
      pageSize?: number;
      locale?: string;
      status?: string;
    },
  ) => {
    const client = makeContentClient(apiKey);
    return client
      .get<PagedContentResultDto>(`/api/${siteSlug}/${schemaSlug}`, { params })
      .then((r) => r.data);
  },

  getEntry: (
    siteSlug: string,
    schemaSlug: string,
    id: string,
    apiKey: string,
  ) => {
    const client = makeContentClient(apiKey);
    return client
      .get<ContentEntryResponseDto>(`/api/${siteSlug}/${schemaSlug}/${id}`)
      .then((r) => r.data);
  },

  create: (
    siteSlug: string,
    schemaSlug: string,
    dto: CreateContentEntryDto,
    apiKey: string,
  ) => {
    const client = makeContentClient(apiKey);
    return client
      .post<ContentEntryResponseDto>(`/api/${siteSlug}/${schemaSlug}`, dto)
      .then((r) => r.data);
  },

  update: (
    siteSlug: string,
    schemaSlug: string,
    id: string,
    dto: UpdateContentEntryDto,
    apiKey: string,
  ) => {
    const client = makeContentClient(apiKey);
    return client
      .put<ContentEntryResponseDto>(`/api/${siteSlug}/${schemaSlug}/${id}`, dto)
      .then((r) => r.data);
  },

  delete: (
    siteSlug: string,
    schemaSlug: string,
    id: string,
    apiKey: string,
  ) => {
    const client = makeContentClient(apiKey);
    return client.delete(`/api/${siteSlug}/${schemaSlug}/${id}`);
  },

  createLocalization: (
    siteSlug: string,
    schemaSlug: string,
    id: string,
    dto: CreateLocalizationDto,
    apiKey: string,
  ) => {
    const client = makeContentClient(apiKey);
    return client
      .post<ContentEntryResponseDto>(
        `/api/${siteSlug}/${schemaSlug}/${id}/localizations`,
        dto,
      )
      .then((r) => r.data);
  },

  getLocalizations: (
    siteSlug: string,
    schemaSlug: string,
    id: string,
    apiKey: string,
  ) => {
    const client = makeContentClient(apiKey);
    return client
      .get<
        ContentEntryResponseDto[]
      >(`/api/${siteSlug}/${schemaSlug}/${id}/localizations`)
      .then((r) => r.data);
  },
};

// ── Media ─────────────────────────────────────────────────────────────────────
export const mediaApi = {
  getAll: (websiteId: string, folderId?: string | null) =>
    adminClient
      .get<MediaAssetResponseDto[]>(`/api/admin/websites/${websiteId}/media`, {
        params: folderId !== undefined ? { folderId } : {},
      })
      .then((r) => r.data),

  upload: (websiteId: string, file: File, folderId?: string | null) => {
    const form = new FormData();
    form.append("file", file);
    return adminClient
      .post<MediaAssetResponseDto>(
        `/api/admin/websites/${websiteId}/media`,
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
          params: folderId ? { folderId } : {},
        },
      )
      .then((r) => r.data);
  },

  move: (websiteId: string, id: string, dto: MoveMediaAssetDto) =>
    adminClient
      .patch<MediaAssetResponseDto>(
        `/api/admin/websites/${websiteId}/media/${id}/move`,
        dto,
      )
      .then((r) => r.data),

  delete: (websiteId: string, id: string) =>
    adminClient.delete(`/api/admin/websites/${websiteId}/media/${id}`),

  // ── Folder operations ─────────────────────────────────────────────────
  getFolders: (websiteId: string, parentFolderId?: string | null) =>
    adminClient
      .get<
        MediaFolderResponseDto[]
      >(`/api/admin/websites/${websiteId}/media/folders`, { params: parentFolderId !== undefined ? { parentFolderId } : {} })
      .then((r) => r.data),

  createFolder: (websiteId: string, dto: CreateMediaFolderDto) =>
    adminClient
      .post<MediaFolderResponseDto>(
        `/api/admin/websites/${websiteId}/media/folders`,
        dto,
      )
      .then((r) => r.data),

  renameFolder: (websiteId: string, id: string, dto: RenameMediaFolderDto) =>
    adminClient
      .put<MediaFolderResponseDto>(
        `/api/admin/websites/${websiteId}/media/folders/${id}`,
        dto,
      )
      .then((r) => r.data),

  deleteFolder: (websiteId: string, id: string) =>
    adminClient.delete(`/api/admin/websites/${websiteId}/media/folders/${id}`),
};

// ── Translations ────────────────────────────────────────────────────────────────────
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

// ── Locales ───────────────────────────────────────────────────────────────────
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
