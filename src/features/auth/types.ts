// ── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginDto {
  username: string;
  password: string;
}

export interface TokenResponseDto {
  accessToken: string;
  expiresAt: string;
}

export interface UpdateProfileDto {
  username: string;
  email: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
