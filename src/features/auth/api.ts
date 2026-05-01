import { adminClient } from "../../core/api/adminClient";
import type { AdminUserResponseDto } from "../admin-users/types";
import type {
  LoginDto,
  TokenResponseDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from "./types";

export const authApi = {
  login: (dto: LoginDto) =>
    adminClient
      .post<TokenResponseDto>("/api/auth/login", dto)
      .then((r) => r.data),

  getMe: () =>
    adminClient.get<AdminUserResponseDto>("/api/auth/me").then((r) => r.data),

  updateProfile: (dto: UpdateProfileDto) =>
    adminClient
      .put<AdminUserResponseDto>("/api/auth/me", dto)
      .then((r) => r.data),

  changePassword: (dto: ChangePasswordDto) =>
    adminClient.put("/api/auth/me/password", dto),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return adminClient
      .put<AdminUserResponseDto>("/api/auth/me/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};
