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
