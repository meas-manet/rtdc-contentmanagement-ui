import type { FieldType } from "./types";

export const FIELD_TYPES: { label: string; value: FieldType }[] = [
  { label: "String", value: "string" },
  { label: "Slug", value: "slug" },
  { label: "Number", value: "number" },
  { label: "Boolean", value: "boolean" },
  { label: "Rich Text", value: "richtext" },
  { label: "Date", value: "date" },
  { label: "Array", value: "array" },
  { label: "Object", value: "object" },
  { label: "Relation", value: "relation" },
  { label: "Media", value: "media" },
];

export const RELATION_TYPES = [
  {
    label: "1:1 — One to One",
    value: "one-to-one",
    description: "",
  },
  {
    label: "1:N — One to Many",
    value: "one-to-many",
    description: "",
  },
  {
    label: "N:N — Many to Many",
    value: "many-to-many",
    description: "",
  },
];

export const MEDIA_ASSET_TYPES = [
  {
    label: "Single asset",
    value: "single",
    description: "Links one media file from the library.",
  },
  {
    label: "Multiple assets",
    value: "multi",
    description: "Links many media files from the library.",
  },
];
