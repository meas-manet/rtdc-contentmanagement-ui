// ── Content / Entries ─────────────────────────────────────────────────────────
export type ContentStatus = "draft" | "published";

export interface ContentEntryResponseDto {
  id: string;
  schemaId: string;
  websiteId: string;
  status: ContentStatus;
  locale: string;
  localizationGroupId?: string;
  createdAt: string;
  updatedAt: string;
  data: Record<string, unknown>;
}

export interface PagedContentResultDto {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  data: ContentEntryResponseDto[];
}

export interface CreateContentEntryDto {
  data: Record<string, unknown>;
  status?: ContentStatus;
  locale?: string;
}

export interface UpdateContentEntryDto {
  data: Record<string, unknown>;
  status?: ContentStatus;
}

export interface UpdateStatusDto {
  status: ContentStatus;
}

export interface CreateLocalizationDto {
  data: Record<string, unknown>;
  locale: string;
  status?: ContentStatus;
}
