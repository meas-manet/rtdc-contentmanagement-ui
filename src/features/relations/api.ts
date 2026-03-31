import { makeContentClient } from "../../core/api/contentClient";
import type {
  RelationItemDto,
  RelationResponseDto,
  CreateRelationBodyDto,
} from "./types";

export const relationsApi = {
  /**
   * GET /api/{siteSlug}/{schemaSlug}/{parentId}/relations
   * Returns all relations enriched with child entry data.
   */
  list: (
    siteSlug: string,
    schemaSlug: string,
    parentId: string,
    apiKey: string,
    params?: { relationName?: string },
  ): Promise<RelationItemDto[]> =>
    makeContentClient(apiKey)
      .get<RelationItemDto[]>(
        `/api/${siteSlug}/${schemaSlug}/${parentId}/relations`,
        { params },
      )
      .then((r) => r.data),

  /**
   * POST /api/{siteSlug}/{schemaSlug}/{parentId}/relations
   * Creates a link between the parent and a child entry.
   */
  create: (
    siteSlug: string,
    schemaSlug: string,
    parentId: string,
    dto: CreateRelationBodyDto,
    apiKey: string,
  ): Promise<RelationResponseDto> =>
    makeContentClient(apiKey)
      .post<RelationResponseDto>(
        `/api/${siteSlug}/${schemaSlug}/${parentId}/relations`,
        dto,
      )
      .then((r) => r.data),

  /**
   * DELETE /api/{siteSlug}/{schemaSlug}/{parentId}/relations/{relationId}
   * Removes (unlinks) a relation by its record ID.
   */
  delete: (
    siteSlug: string,
    schemaSlug: string,
    parentId: string,
    relationId: string,
    apiKey: string,
  ): Promise<void> =>
    makeContentClient(apiKey)
      .delete(
        `/api/${siteSlug}/${schemaSlug}/${parentId}/relations/${relationId}`,
      )
      .then(() => undefined),
};
