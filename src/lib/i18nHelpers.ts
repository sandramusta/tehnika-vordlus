/**
 * Get a translated field value from a JSONB translations object.
 *
 * Fallback chain: target language → "en" → "et" (original) → fallback string
 *
 * @param translations  JSONB object e.g. { en: "Combine", de: "Mähdrescher", ... }
 * @param lang          Target language code, e.g. "de"
 * @param fallback      Original Estonian / default value
 */
export function getTranslation(
  translations: Record<string, string> | null | undefined,
  lang: string,
  fallback: string,
): string {
  if (!translations) return fallback;
  return translations[lang] ?? translations["en"] ?? translations["et"] ?? fallback;
}

/**
 * Get a translated field set from a JSONB translations map keyed by language.
 *
 * Used for CompetitiveArgument / Myth where multiple fields are translated per row.
 * Example translations shape: { en: { title: "...", description: "..." }, de: { ... } }
 *
 * Returns the field value for the given language with en → et → fallback chain.
 */
export function getTranslationField(
  translations: Record<string, Record<string, string>> | null | undefined,
  lang: string,
  field: string,
  fallback: string,
): string {
  if (!translations) return fallback;
  const langObj = translations[lang] ?? translations["en"] ?? translations["et"];
  if (!langObj) return fallback;
  return langObj[field] ?? fallback;
}
