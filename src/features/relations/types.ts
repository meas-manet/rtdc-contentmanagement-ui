// ── Relations ──────────────────────────────────────────────────────────────────

export type RelationType = "one-to-one" | "one-to-many" | "many-to-many";

/**
 * A single relation record returned by GET /{parentId}/relations.
 * Carries the child entry's data inline so the UI can display labels
 * without an additional round-trip.
 */
export interface RelationItemDto {
  /** Relation record ID — used for DELETE (unlink). */
  id: string;
  childId: string;
  relationType: RelationType;
  relationName: string;
  /** Deserialized data fields of the child entry, e.g. { name: "Jane" }. */
  childData: Record<string, unknown>;
  childStatus: string;
  childCreatedAt: string;
}

/**
 * Body sent to POST /{parentId}/relations.
 * parentId comes from the route, not the body.
 */
export interface CreateRelationBodyDto {
  childId: string;
  relationType: RelationType;
  relationName: string;
}

/** Raw creation response from the server. */
export interface RelationResponseDto {
  id: string;
  parentId: string;
  childId: string;
  relationType: RelationType;
  relationName: string;
}
