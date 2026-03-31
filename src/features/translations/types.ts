// ── Translations ──────────────────────────────────────────────────────────────
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
