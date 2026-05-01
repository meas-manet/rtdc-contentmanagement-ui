// ── API Explorer types ────────────────────────────────────────────────────────

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface EndpointParam {
  name: string;
  in: "path" | "query" | "header";
  required: boolean;
  description: string;
  /** Default value pre-populated in the UI */
  defaultValue?: string;
}

export interface EndpointBody {
  description: string;
  exampleJson: string;
}

export interface Endpoint {
  id: string;
  method: HttpMethod;
  /** URL template with {param} placeholders, e.g. /api/{siteSlug}/{schemaSlug}/{id} */
  path: string;
  summary: string;
  description?: string;
  /** Which authentication is required */
  auth: "none" | "bearer" | "apikey" | "bearer-or-apikey";
  params: EndpointParam[];
  body?: EndpointBody;
  /** Display group in the sidebar */
  group: string;
}

export interface EndpointGroup {
  label: string;
  slug: string;
  endpoints: Endpoint[];
}

// ── Request / Response state ──────────────────────────────────────────────────

export interface ParamValue {
  name: string;
  value: string;
}

export interface RequestState {
  pathParams: ParamValue[];
  queryParams: ParamValue[];
  bodyJson: string;
}

export interface ResponseState {
  status: number;
  statusText: string;
  durationMs: number;
  body: string;
  headers: Record<string, string>;
  error?: string;
}
