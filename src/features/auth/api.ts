import { adminClient } from "../../core/api/adminClient";
import type { LoginDto, TokenResponseDto } from "./types";

export const authApi = {
  login: (dto: LoginDto) =>
    adminClient
      .post<TokenResponseDto>("/api/auth/login", dto)
      .then((r) => r.data),
};
