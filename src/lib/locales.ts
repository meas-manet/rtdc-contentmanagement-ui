import { useQuery } from "@tanstack/react-query";
import { localesApi } from "./api";
import type { LocaleResponseDto } from "./types";

/** React Query hook — fetches all locale registry entries from the database. */
export function useLocales() {
  return useQuery({
    queryKey: ["locales"],
    queryFn: localesApi.getAll,
    staleTime: 5 * 60 * 1000,
  });
}

/** Returns a human-readable label for a BCP-47 locale code from the dynamic registry. */
export function localeLabel(
  code: string,
  allLocales: LocaleResponseDto[],
): string {
  return allLocales.find((l) => l.code === code)?.label ?? code;
}

/**
 * Converts a website's supportedLocales code array to antd Select options,
 * looking up display labels from the locale registry.
 */
export function toLocaleOptions(
  codes: string[],
  allLocales: LocaleResponseDto[],
) {
  return codes.map((code) => ({
    value: code,
    label: allLocales.find((l) => l.code === code)?.label ?? code,
  }));
}
