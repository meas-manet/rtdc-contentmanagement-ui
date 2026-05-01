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

export interface WebsiteSummaryDto {
  publishedEntries: number;
  draftEntries: number;
  lastAuditAction: string | null;
  lastAuditActor: string | null;
  lastAuditAt: string | null;
  mediaCount: number;
  mediaSizeBytes: number;
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
