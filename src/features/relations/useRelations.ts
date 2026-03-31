import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { relationsApi } from "./api";
import type { CreateRelationBodyDto, RelationItemDto } from "./types";

/**
 * Manages all data-fetching and mutation for a single (parent, relationName) pair.
 *
 * Optimistic updates:
 *   linkMutation   — instantly appends the new item before the server confirms.
 *   unlinkMutation — instantly removes the item before the server confirms.
 *   Both roll back on error and re-sync on settled.
 */
export function useRelations(
  siteSlug: string,
  parentSchemaSlug: string,
  parentId: string,
  apiKey: string,
  relationName: string,
) {
  const qc = useQueryClient();
  const queryKey = [
    "relations",
    siteSlug,
    parentSchemaSlug,
    parentId,
    relationName,
  ] as const;

  // ── Query ────────────────────────────────────────────────────────
  const query = useQuery({
    queryKey,
    queryFn: () =>
      relationsApi.list(siteSlug, parentSchemaSlug, parentId, apiKey, {
        relationName,
      }),
    enabled: Boolean(parentId && siteSlug && parentSchemaSlug),
  });

  // ── Link (create) ────────────────────────────────────────────────
  const linkMutation = useMutation({
    mutationFn: (dto: CreateRelationBodyDto) =>
      relationsApi.create(siteSlug, parentSchemaSlug, parentId, dto, apiKey),

    onMutate: async (dto) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<RelationItemDto[]>(queryKey);

      const optimistic: RelationItemDto = {
        id: `optimistic-${crypto.randomUUID()}`,
        childId: dto.childId,
        relationType: dto.relationType,
        relationName: dto.relationName,
        childData: {},
        childStatus: "draft",
        childCreatedAt: new Date().toISOString(),
      };

      qc.setQueryData<RelationItemDto[]>(queryKey, (old) => [
        ...(old ?? []),
        optimistic,
      ]);

      return { prev };
    },

    onError: (_err, _dto, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(queryKey, ctx.prev);
    },

    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  // ── Unlink (delete) ──────────────────────────────────────────────
  const unlinkMutation = useMutation({
    mutationFn: (relationId: string) =>
      relationsApi.delete(
        siteSlug,
        parentSchemaSlug,
        parentId,
        relationId,
        apiKey,
      ),

    onMutate: async (relationId) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<RelationItemDto[]>(queryKey);

      qc.setQueryData<RelationItemDto[]>(queryKey, (old) =>
        (old ?? []).filter((r) => r.id !== relationId),
      );

      return { prev };
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(queryKey, ctx.prev);
    },

    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  return { query, linkMutation, unlinkMutation };
}
