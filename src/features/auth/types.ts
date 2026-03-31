// ── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginDto {
  username: string;
  password: string;
}

export interface TokenResponseDto {
  accessToken: string;
  expiresAt: string;
}
