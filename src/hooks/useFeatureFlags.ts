import { featureFlags, type FeatureFlags } from "@/lib/featureFlags";

/**
 * Returns the current feature flags.
 * Flags are read from VITE_ENABLE_* environment variables at build time.
 * All flags default to true — set the env var to "false" to disable.
 */
export function useFeatureFlags(): FeatureFlags {
  return featureFlags;
}
