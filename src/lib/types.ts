// ── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginDto {
  username: string;
  password: string;
}

export interface TokenResponseDto {
  accessToken: string;
  expiresAt: string;
}

// ── Website ───────────────────────────────────────────────────────────────────
export interface WebsiteResponseDto {
  id: string;
  name: string;
  slug: string;
  apiKey: string;
  defaultLocale: string;
  supportedLocales: string[];
  createdAt: string;
}

export interface CreateWebsiteDto {
  name: string;
  slug: string;
  defaultLocale?: string;
  supportedLocales?: string[];
}

export interface UpdateWebsiteDto {
  name: string;
  slug: string;
  defaultLocale?: string;
  supportedLocales?: string[];
}

// ── Schema ────────────────────────────────────────────────────────────────────
export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "richtext"
  | "date"
  | "array"
  | "object";

export interface SchemaFieldDto {
  name: string;
  type: FieldType;
  required: boolean;
  defaultValue?: string;
}

export interface SchemaResponseDto {
  id: string;
  websiteId: string;
  name: string;
  slug: string;
  definition: SchemaFieldDto[];
  createdAt: string;
}

export interface CreateSchemaDto {
  name: string;
  slug: string;
  definition: SchemaFieldDto[];
}

export interface UpdateSchemaDto {
  name: string;
  definition: SchemaFieldDto[];
}

// ── Content ───────────────────────────────────────────────────────────────────
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

// ── Media ─────────────────────────────────────────────────────────────────────
export interface MediaAssetResponseDto {
  id: string;
  websiteId: string;
  folderId: string | null;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  url: string;
  uploadedAt: string;
}

export interface MediaFolderResponseDto {
  id: string;
  websiteId: string;
  parentFolderId: string | null;
  name: string;
  createdAt: string;
  assetCount: number;
  subFolderCount: number;
}

export interface CreateMediaFolderDto {
  name: string;
  parentFolderId?: string | null;
}

export interface RenameMediaFolderDto {
  name: string;
}

export interface MoveMediaAssetDto {
  folderId: string | null;
}

// ── Relations ─────────────────────────────────────────────────────────────────
export type RelationType = "one-to-one" | "one-to-many" | "many-to-many";

export interface RelationResponseDto {
  id: string;
  parentId: string;
  childId: string;
  relationType: RelationType;
  relationName: string;
}

// ── Translations ────────────────────────────────────────────────────────────────────
export interface TranslationResponseDto {
  id: string;
  locale: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTranslationDto {
  locale: string;
  key: string;
  value: string;
}

export interface UpdateTranslationDto {
  value: string;
}

// ── Locales ───────────────────────────────────────────────────────────────────
export interface LocaleResponseDto {
  id: string;
  code: string;
  label: string;
  createdAt: string;
}

export interface CreateLocaleDto {
  code: string;
  label: string;
}

export interface UpdateLocaleDto {
  label: string;
}
