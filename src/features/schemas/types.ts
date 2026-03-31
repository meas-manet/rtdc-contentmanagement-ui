// ── Schema ────────────────────────────────────────────────────────────────────
export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "richtext"
  | "date"
  | "array"
  | "object"
  | "relation";

export interface SchemaFieldDto {
  name: string;
  type: FieldType;
  required: boolean;
  defaultValue?: string;
  // Populated only when type === "relation"
  targetSchemaSlug?: string;
  relationType?: "one-to-one" | "one-to-many" | "many-to-many";
  labelField?: string;
}

export interface SchemaResponseDto {
  id: string;
  websiteId: string;
  name: string;
  slug: string;
  definition: SchemaFieldDto[];
  createdAt: string;
}

export interface CreateSchemaDto {
  name: string;
  slug: string;
  definition: SchemaFieldDto[];
}

export interface UpdateSchemaDto {
  name: string;
  definition: SchemaFieldDto[];
}
