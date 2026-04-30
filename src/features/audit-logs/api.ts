import { adminClient } from "../../core/api/adminClient";
import type { AuditLogPageDto } from "./types";

export const auditLogsApi = {
  getAll: (params: {
    websiteId?: string | null;
    page: number;
    pageSize: number;
  }) =>
    adminClient
      .get<AuditLogPageDto>("/api/admin/audit-logs", {
        params: {
          ...(params.websiteId ? { websiteId: params.websiteId } : {}),
          page: params.page,
          pageSize: params.pageSize,
        },
      })
      .then((r) => r.data),
};
