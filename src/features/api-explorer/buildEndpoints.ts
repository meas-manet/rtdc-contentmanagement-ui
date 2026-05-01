import type { SchemaResponseDto } from "../schemas/types";
import type { Endpoint, EndpointGroup } from "./types";

// ── Shared path params ────────────────────────────────────────────────────────

function siteSlugParam(slug: string) {
  return {
    name: "siteSlug",
    in: "path" as const,
    required: true,
    description: "The website slug",
    defaultValue: slug,
  };
}

function schemaSlugParam(slug: string) {
  return {
    name: "schemaSlug",
    in: "path" as const,
    required: true,
    description: "The schema slug",
    defaultValue: slug,
  };
}

const idParam = {
  name: "id",
  in: "path" as const,
  required: true,
  description: "Entry UUID",
  defaultValue: "",
};

const slugParam = {
  name: "slug",
  in: "path" as const,
  required: true,
  description: "Entry URL slug",
  defaultValue: "",
};

const pageParams = [
  {
    name: "page",
    in: "query" as const,
    required: false,
    description: "Page number (default 1)",
    defaultValue: "1",
  },
  {
    name: "pageSize",
    in: "query" as const,
    required: false,
    description: "Items per page (default 20, max 100)",
    defaultValue: "20",
  },
  {
    name: "locale",
    in: "query" as const,
    required: false,
    description: 'BCP-47 locale tag (default "en")',
    defaultValue: "en",
  },
  {
    name: "include",
    in: "query" as const,
    required: false,
    description:
      "Comma-separated relation names to populate (e.g. author,tags)",
    defaultValue: "",
  },
];

// ── Public Content API endpoints ──────────────────────────────────────────────

function buildPublicEndpoints(
  siteSlug: string,
  schema: SchemaResponseDto,
): Endpoint[] {
  const p = [siteSlugParam(siteSlug), schemaSlugParam(schema.slug)];

  const exampleData = buildExampleData(schema);

  return [
    {
      id: `public-${schema.slug}-list`,
      method: "GET",
      path: "/api/{siteSlug}/{schemaSlug}",
      summary: `List ${schema.name}`,
      description:
        "Returns all published entries. Supports pagination, locale filtering, and relation includes.",
      auth: "none",
      group: schema.name,
      params: [...p, ...pageParams],
    },
    {
      id: `public-${schema.slug}-get`,
      method: "GET",
      path: "/api/{siteSlug}/{schemaSlug}/{id}",
      summary: `Get ${schema.name} by ID`,
      description: "Returns a single published entry by its UUID.",
      auth: "none",
      group: schema.name,
      params: [
        ...p,
        idParam,
        {
          name: "include",
          in: "query" as const,
          required: false,
          description: "Relation names to populate",
          defaultValue: "",
        },
      ],
    },
    {
      id: `public-${schema.slug}-get-slug`,
      method: "GET",
      path: "/api/{siteSlug}/{schemaSlug}/by-slug/{slug}",
      summary: `Get ${schema.name} by slug`,
      description: "Returns a single published entry by its URL slug.",
      auth: "none",
      group: schema.name,
      params: [
        ...p,
        slugParam,
        {
          name: "locale",
          in: "query" as const,
          required: false,
          description: 'BCP-47 locale (default "en")',
          defaultValue: "en",
        },
        {
          name: "include",
          in: "query" as const,
          required: false,
          description: "Relation names to populate",
          defaultValue: "",
        },
      ],
    },
    {
      id: `public-${schema.slug}-create`,
      method: "POST",
      path: "/api/{siteSlug}/{schemaSlug}",
      summary: `Create ${schema.name}`,
      description: "Creates a new entry. Requires X-API-Key header.",
      auth: "apikey",
      group: schema.name,
      params: p,
      body: {
        description: "Entry data matching the schema definition.",
        exampleJson: JSON.stringify(
          { data: exampleData, status: "draft", locale: "en" },
          null,
          2,
        ),
      },
    },
    {
      id: `public-${schema.slug}-update`,
      method: "PUT",
      path: "/api/{siteSlug}/{schemaSlug}/{id}",
      summary: `Update ${schema.name}`,
      description: "Updates an existing entry. Requires X-API-Key header.",
      auth: "apikey",
      group: schema.name,
      params: [...p, idParam],
      body: {
        description: "Partial or full entry data to update.",
        exampleJson: JSON.stringify(
          { data: exampleData, status: "published" },
          null,
          2,
        ),
      },
    },
    {
      id: `public-${schema.slug}-delete`,
      method: "DELETE",
      path: "/api/{siteSlug}/{schemaSlug}/{id}",
      summary: `Delete ${schema.name}`,
      description: "Permanently deletes an entry. Requires X-API-Key header.",
      auth: "apikey",
      group: schema.name,
      params: [...p, idParam],
    },
    {
      id: `public-${schema.slug}-relations-get`,
      method: "GET",
      path: "/api/{siteSlug}/{schemaSlug}/{id}/relations",
      summary: `List ${schema.name} relations`,
      description:
        "Lists all linked relations for an entry. Optionally filter by ?relationName=.",
      auth: "none",
      group: schema.name,
      params: [
        ...p,
        idParam,
        {
          name: "relationName",
          in: "query" as const,
          required: false,
          description: "Filter by relation key",
          defaultValue: "",
        },
      ],
    },
    {
      id: `public-${schema.slug}-relations-post`,
      method: "POST",
      path: "/api/{siteSlug}/{schemaSlug}/{id}/relations",
      summary: `Add ${schema.name} relation`,
      description: "Links a child entry to this entry. Requires X-API-Key.",
      auth: "apikey",
      group: schema.name,
      params: [...p, idParam],
      body: {
        description: "Relation descriptor.",
        exampleJson: JSON.stringify(
          { childId: "", relationType: "one-to-many", relationName: "" },
          null,
          2,
        ),
      },
    },
  ];
}

// ── Example JSON body builder ─────────────────────────────────────────────────

function buildExampleData(schema: SchemaResponseDto): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const field of schema.definition) {
    switch (field.type) {
      case "string":
      case "slug":
        obj[field.name] = "";
        break;
      case "number":
        obj[field.name] = 0;
        break;
      case "boolean":
        obj[field.name] = false;
        break;
      case "richtext":
        obj[field.name] = "<p></p>";
        break;
      case "date":
        obj[field.name] = new Date().toISOString().split("T")[0];
        break;
      case "array":
        obj[field.name] = [];
        break;
      case "object":
        obj[field.name] = {};
        break;
      case "relation":
        obj[field.name] = null;
        break;
      case "media":
        obj[field.name] = field.mediaAssetType === "multi" ? [] : null;
        break;
      default:
        obj[field.name] = null;
    }
  }
  return obj;
}

// ── Media API endpoints ───────────────────────────────────────────────────────

function buildMediaEndpoints(websiteId: string): Endpoint[] {
  const websiteIdParam = {
    name: "websiteId",
    in: "path" as const,
    required: true,
    description: "Website UUID",
    defaultValue: websiteId,
  };
  const folderIdParam = {
    name: "folderId",
    in: "path" as const,
    required: true,
    description: "Folder UUID",
    defaultValue: "",
  };
  const assetIdParam = {
    name: "assetId",
    in: "path" as const,
    required: true,
    description: "Asset UUID",
    defaultValue: "",
  };

  return [
    {
      id: "admin-media-list",
      method: "GET",
      path: "/api/admin/websites/{websiteId}/media/assets",
      summary: "List media assets",
      description:
        "Returns all media assets for the website, optionally filtered by folder.",
      auth: "bearer",
      group: "Media",
      params: [
        websiteIdParam,
        {
          name: "folderId",
          in: "query" as const,
          required: false,
          description: "Filter by folder UUID (omit for root)",
          defaultValue: "",
        },
      ],
    },
    {
      id: "admin-media-upload",
      method: "POST",
      path: "/api/admin/websites/{websiteId}/media/assets",
      summary: "Upload a media asset",
      description:
        'Uploads a file to MinIO. Send as multipart/form-data with a "file" field.',
      auth: "bearer",
      group: "Media",
      params: [websiteIdParam],
      body: {
        description: 'Multipart form-data with field "file".',
        exampleJson: "// Send as multipart/form-data",
      },
    },
    {
      id: "admin-media-delete",
      method: "DELETE",
      path: "/api/admin/websites/{websiteId}/media/assets/{assetId}",
      summary: "Delete a media asset",
      auth: "bearer",
      group: "Media",
      params: [websiteIdParam, assetIdParam],
    },
    {
      id: "admin-media-folders-list",
      method: "GET",
      path: "/api/admin/websites/{websiteId}/media/folders",
      summary: "List media folders",
      auth: "bearer",
      group: "Media",
      params: [websiteIdParam],
    },
    {
      id: "admin-media-folders-create",
      method: "POST",
      path: "/api/admin/websites/{websiteId}/media/folders",
      summary: "Create media folder",
      auth: "bearer",
      group: "Media",
      params: [websiteIdParam],
      body: {
        description: "Folder name and optional parent.",
        exampleJson: JSON.stringify(
          { name: "my-folder", parentFolderId: null },
          null,
          2,
        ),
      },
    },
    {
      id: "admin-media-folders-delete",
      method: "DELETE",
      path: "/api/admin/websites/{websiteId}/media/folders/{folderId}",
      summary: "Delete media folder",
      auth: "bearer",
      group: "Media",
      params: [websiteIdParam, folderIdParam],
    },
  ];
}

// ── Admin content endpoints ───────────────────────────────────────────────────

function buildAdminContentEndpoints(
  websiteId: string,
  schema: SchemaResponseDto,
): Endpoint[] {
  const params = [
    {
      name: "websiteId",
      in: "path" as const,
      required: true,
      description: "Website UUID",
      defaultValue: websiteId,
    },
    {
      name: "schemaId",
      in: "path" as const,
      required: true,
      description: "Schema UUID",
      defaultValue: schema.id,
    },
  ];

  return [
    {
      id: `admin-entries-${schema.slug}-list`,
      method: "GET",
      path: "/api/admin/websites/{websiteId}/schemas/{schemaId}/entries",
      summary: `Admin list ${schema.name} entries`,
      description: "Returns all entries including drafts (JWT auth required).",
      auth: "bearer",
      group: `Admin / ${schema.name}`,
      params: [
        ...params,
        {
          name: "page",
          in: "query" as const,
          required: false,
          description: "Page (default 1)",
          defaultValue: "1",
        },
        {
          name: "pageSize",
          in: "query" as const,
          required: false,
          description: "Page size (default 20)",
          defaultValue: "20",
        },
        {
          name: "locale",
          in: "query" as const,
          required: false,
          description: "Locale filter",
          defaultValue: "",
        },
        {
          name: "status",
          in: "query" as const,
          required: false,
          description: '"draft" or "published"',
          defaultValue: "",
        },
      ],
    },
    {
      id: `admin-entries-${schema.slug}-delete`,
      method: "DELETE",
      path: "/api/admin/websites/{websiteId}/schemas/{schemaId}/entries/{entryId}",
      summary: `Admin delete ${schema.name} entry`,
      auth: "bearer",
      group: `Admin / ${schema.name}`,
      params: [
        ...params,
        {
          name: "entryId",
          in: "path" as const,
          required: true,
          description: "Entry UUID",
          defaultValue: "",
        },
      ],
    },
  ];
}

// ── Main builder ──────────────────────────────────────────────────────────────

/**
 * Builds the full endpoint catalog for a website, grouped by resource.
 * Public API is grouped by schema slug; Admin API groups are prefixed with "Admin /".
 */
export function buildEndpointGroups(
  websiteId: string,
  siteSlug: string,
  schemas: SchemaResponseDto[],
): EndpointGroup[] {
  const groups: EndpointGroup[] = [];

  // One group per schema for the Public Content API
  for (const schema of schemas) {
    groups.push({
      label: schema.name,
      slug: schema.slug,
      endpoints: buildPublicEndpoints(siteSlug, schema),
    });
  }

  // Shared Media group
  groups.push({
    label: "Media",
    slug: "__media__",
    endpoints: buildMediaEndpoints(websiteId),
  });

  // Admin content per schema
  for (const schema of schemas) {
    groups.push({
      label: `Admin / ${schema.name}`,
      slug: `__admin__${schema.slug}`,
      endpoints: buildAdminContentEndpoints(websiteId, schema),
    });
  }

  return groups;
}

// ── URL builder ───────────────────────────────────────────────────────────────

/**
 * Resolves a path template with the given path param values.
 * e.g. /api/{siteSlug}/{schemaSlug} + { siteSlug: "demo" } → /api/demo/{schemaSlug}
 */
export function resolvePathParams(
  pathTemplate: string,
  pathParams: { name: string; value: string }[],
): string {
  let resolved = pathTemplate;
  for (const { name, value } of pathParams) {
    resolved = resolved.replace(`{${name}}`, value || `{${name}}`);
  }
  return resolved;
}

/** Appends query params (non-empty values only) to a base URL string. */
export function appendQueryParams(
  base: string,
  queryParams: { name: string; value: string }[],
): string {
  const filled = queryParams.filter((p) => p.value.trim() !== "");
  if (filled.length === 0) return base;
  const qs = filled
    .map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`)
    .join("&");
  return `${base}?${qs}`;
}
