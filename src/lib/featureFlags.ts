/**
 * Feature Flag system
 *
 * All flags default to TRUE (opt-out model).
 * To disable a feature, set the env var to "false" or "0" in your deployment.
 *
 * Example (.env or Vercel environment variables):
 *   VITE_ENABLE_MYTHS=false
 *   VITE_ENABLE_ROI_CALCULATOR=false
 */

export interface FeatureFlags {
  /** Müüdid page, nav item, and admin Myths tab */
  enableMyths: boolean;
  /** Statistika page and nav item */
  enableStats: boolean;
  /** TCO (Total Cost of Ownership) section on the Comparison page */
  enableTco: boolean;
  /** ROI Comparison Calculator on the Comparison page */
  enableRoiCalculator: boolean;
  /** PDF export button on the Comparison page */
  enablePdfExport: boolean;
  /** Competitive Advantages section on the Comparison page */
  enableCompetitiveAdvantages: boolean;
  /** Auto mode (competitor detection) in the Comparison mode selector */
  enableAutoMode: boolean;
  /** Brochure upload feature in the Admin equipment list */
  enableBrochureUpload: boolean;
  /** Competitive Arguments admin tab */
  enableArguments: boolean;
}

function parseFlag(value: string | undefined): boolean {
  if (value === undefined || value === "") return true;
  return value !== "false" && value !== "0";
}

export const featureFlags: FeatureFlags = {
  enableMyths:                 parseFlag(import.meta.env.VITE_ENABLE_MYTHS),
  enableStats:                 parseFlag(import.meta.env.VITE_ENABLE_STATS),
  enableTco:                   parseFlag(import.meta.env.VITE_ENABLE_TCO),
  enableRoiCalculator:         parseFlag(import.meta.env.VITE_ENABLE_ROI_CALCULATOR),
  enablePdfExport:             parseFlag(import.meta.env.VITE_ENABLE_PDF_EXPORT),
  enableCompetitiveAdvantages: parseFlag(import.meta.env.VITE_ENABLE_COMPETITIVE_ADVANTAGES),
  enableAutoMode:              parseFlag(import.meta.env.VITE_ENABLE_AUTO_MODE),
  enableBrochureUpload:        parseFlag(import.meta.env.VITE_ENABLE_BROCHURE_UPLOAD),
  enableArguments:             parseFlag(import.meta.env.VITE_ENABLE_ARGUMENTS),
};
