import { makeContentClient } from "../../core/api/contentClient";
import type {
  ContentEntryResponseDto,
  PagedContentResultDto,
  CreateContentEntryDto,
  UpdateContentEntryDto,
  CreateLocalizationDto,
} from "./types";

export const contentApi = {
  getEntries: (
    siteSlug: string,
    schemaSlug: string,
    apiKey: string,
    params: {
      page?: number;
      pageSize?: number;
      locale?: string;
      status?: string;
    },
  ) => {
    const client = makeContentClient(apiKey);
    return client
      .get<PagedContentResultDto>(`/api/${siteSlug}/${schemaSlug}`, { params })
      .then((r) => r.data);
  },

  getEntry: (
    siteSlug: string,
    schemaSlug: string,
    id: string,
    apiKey: string,
  ) => {
    const client = makeContentClient(apiKey);
    return client
      .get<ContentEntryResponseDto>(`/api/${siteSlug}/${schemaSlug}/${id}`)
      .then((r) => r.data);
  },

  create: (
    siteSlug: string,
    schemaSlug: string,
    dto: CreateContentEntryDto,
    apiKey: string,
  ) => {
    const client = makeContentClient(apiKey);
    return client
      .post<ContentEntryResponseDto>(`/api/${siteSlug}/${schemaSlug}`, dto)
      .then((r) => r.data);
  },

  update: (
    siteSlug: string,
    schemaSlug: string,
    id: string,
    dto: UpdateContentEntryDto,
    apiKey: string,
  ) => {
    const client = makeContentClient(apiKey);
    return client
      .put<ContentEntryResponseDto>(`/api/${siteSlug}/${schemaSlug}/${id}`, dto)
      .then((r) => r.data);
  },

  delete: (
    siteSlug: string,
    schemaSlug: string,
    id: string,
    apiKey: string,
  ) => {
    const client = makeContentClient(apiKey);
    return client.delete(`/api/${siteSlug}/${schemaSlug}/${id}`);
  },

  createLocalization: (
    siteSlug: string,
    schemaSlug: string,
    id: string,
    dto: CreateLocalizationDto,
    apiKey: string,
  ) => {
    const client = makeContentClient(apiKey);
    return client
      .post<ContentEntryResponseDto>(
        `/api/${siteSlug}/${schemaSlug}/${id}/localizations`,
        dto,
      )
      .then((r) => r.data);
  },

  getLocalizations: (
    siteSlug: string,
    schemaSlug: string,
    id: string,
    apiKey: string,
  ) => {
    const client = makeContentClient(apiKey);
    return client
      .get<ContentEntryResponseDto[]>(
        `/api/${siteSlug}/${schemaSlug}/${id}/localizations`,
      )
      .then((r) => r.data);
  },
};
