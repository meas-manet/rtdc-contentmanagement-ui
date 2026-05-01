import { adminClient } from "../../core/api/adminClient";
import type {
  MediaAssetResponseDto,
  MediaFolderResponseDto,
  CreateMediaFolderDto,
  RenameMediaFolderDto,
  MoveMediaAssetDto,
  MoveFolderDto,
} from "./types";

export const mediaApi = {
  /** Returns ALL assets for the website across every folder. */
  getAllFlat: (websiteId: string) =>
    adminClient
      .get<
        MediaAssetResponseDto[]
      >(`/api/admin/websites/${websiteId}/media/all`)
      .then((r) => r.data),

  getAll: (websiteId: string, folderId?: string | null) =>
    adminClient
      .get<MediaAssetResponseDto[]>(`/api/admin/websites/${websiteId}/media`, {
        params: folderId !== undefined ? { folderId } : {},
      })
      .then((r) => r.data),

  getById: (websiteId: string, id: string) =>
    adminClient
      .get<MediaAssetResponseDto>(
        `/api/admin/websites/${websiteId}/media/${id}`,
      )
      .then((r) => r.data)
      .catch(() => null),

  upload: (websiteId: string, file: File, folderId?: string | null) => {
    const form = new FormData();
    form.append("file", file);
    return adminClient
      .post<MediaAssetResponseDto>(
        `/api/admin/websites/${websiteId}/media`,
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
          params: folderId ? { folderId } : {},
        },
      )
      .then((r) => r.data);
  },

  move: (websiteId: string, id: string, dto: MoveMediaAssetDto) =>
    adminClient
      .patch<MediaAssetResponseDto>(
        `/api/admin/websites/${websiteId}/media/${id}/move`,
        dto,
      )
      .then((r) => r.data),

  delete: (websiteId: string, id: string) =>
    adminClient.delete(`/api/admin/websites/${websiteId}/media/${id}`),

  // ── Folder operations ─────────────────────────────────────────────────
  getFolders: (websiteId: string, parentFolderId?: string | null) =>
    adminClient
      .get<MediaFolderResponseDto[]>(
        `/api/admin/websites/${websiteId}/media/folders`,
        {
          params: parentFolderId !== undefined ? { parentFolderId } : {},
        },
      )
      .then((r) => r.data),

  createFolder: (websiteId: string, dto: CreateMediaFolderDto) =>
    adminClient
      .post<MediaFolderResponseDto>(
        `/api/admin/websites/${websiteId}/media/folders`,
        dto,
      )
      .then((r) => r.data),

  renameFolder: (websiteId: string, id: string, dto: RenameMediaFolderDto) =>
    adminClient
      .put<MediaFolderResponseDto>(
        `/api/admin/websites/${websiteId}/media/folders/${id}`,
        dto,
      )
      .then((r) => r.data),

  deleteFolder: (websiteId: string, id: string) =>
    adminClient.delete(`/api/admin/websites/${websiteId}/media/folders/${id}`),

  getAllFolders: (websiteId: string) =>
    adminClient
      .get<
        MediaFolderResponseDto[]
      >(`/api/admin/websites/${websiteId}/media/folders/all`)
      .then((r) => r.data),

  moveFolder: (websiteId: string, id: string, dto: MoveFolderDto) =>
    adminClient
      .patch<MediaFolderResponseDto>(
        `/api/admin/websites/${websiteId}/media/folders/${id}/move`,
        dto,
      )
      .then((r) => r.data),
};
