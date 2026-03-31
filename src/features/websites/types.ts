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
