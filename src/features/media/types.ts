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
