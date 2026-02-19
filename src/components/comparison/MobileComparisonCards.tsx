import { Equipment } from "@/types/equipment";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBrandTextColor } from "@/lib/brandColors";
import { useSpecLabels } from "@/hooks/useSpecLabels";

interface SpecRowConfig {
  key: keyof Equipment;
  labelKey: string;
  defaultLabel: string;
  format?: "number" | "currency";
  suffix?: string;
  bestType?: "max" | "min";
  conditional?: boolean;
}

interface MobileComparisonCardsProps {
  selectedModels: Equipment[];
  specRows: SpecRowConfig[];
  costRows: SpecRowConfig[];
  calculateBestValue: (key: keyof Equipment, type: "max" | "min") => number;
  calculateTCO: (equipment: Equipment) => number | null;
  bestTCO: number;
}

function formatNumber(num: number | null): string {
  if (num === null) return "—";
  return new Intl.NumberFormat("et-EE").format(num);
}

function formatCurrency(num: number | null): string {
  if (num === null) return "—";
  return new Intl.NumberFormat("et-EE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(num);
}

function isMissing(value: unknown): boolean {
  return value === null || value === undefined;
}

export function MobileComparisonCards({
  selectedModels,
  specRows,
  costRows,
  calculateBestValue,
  calculateTCO,
  bestTCO,
}: MobileComparisonCardsProps) {
  const { data: specLabels = {} } = useSpecLabels();

  const getLabel = (labelKey: string, defaultLabel: string): string => {
    return specLabels[labelKey] || defaultLabel;
  };

  const renderSpecValue = (
    model: Equipment,
    config: (typeof specRows)[0],
    allModels: Equipment[]
  ) => {
    const { key, format, suffix = "", bestType } = config;
    const value = model[key] as number | null;
    const bestValue = bestType ? calculateBestValue(key, bestType) : null;
    const isBest = bestValue !== null && value === bestValue && value !== null;
    const isJohnDeere = model.brand?.name === "John Deere";

    const displayValue =
      format === "currency"
        ? formatCurrency(value)
        : isMissing(value)
        ? "—"
        : `${formatNumber(value)}${suffix}`;

    return (
      <div className="flex items-center gap-1">
        <span className={cn(isJohnDeere && "font-semibold")}>{displayValue}</span>
        {isBest && allModels.length > 1 && <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />}
      </div>
    );
  };

  // Filter out conditional rows that have no values
  const visibleSpecRows = specRows.filter(
    (config) =>
      !config.conditional ||
      selectedModels.some(
        (m) => m[config.key] !== null && m[config.key] !== undefined
      )
  );

  return (
    <div className="space-y-4">
      {selectedModels.map((model, modelIndex) => {
        const isJohnDeere = model.brand?.name === "John Deere";
        const tco = calculateTCO(model);
        const isBestTCO = tco === bestTCO && tco !== null;

        return (
          <div
            key={model.id}
            className={cn(
              "rounded-lg border overflow-hidden",
              modelIndex === 0
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-card"
            )}
          >
            {/* Card Header */}
            <div className={cn(
              "p-4 flex items-center gap-3",
              modelIndex === 0 ? "bg-primary/10" : "bg-muted/30"
            )}>
              {model.image_url && (
                <img
                  src={model.image_url}
                  alt={model.model_name}
                  className="h-14 w-20 rounded object-contain bg-white shrink-0"
                />
              )}
              <div className="min-w-0">
                <span
                  className={cn(
                    "text-sm font-bold block",
                    getBrandTextColor(model.brand?.name || "")
                  )}
                >
                  {model.brand?.name}
                </span>
                <div className="text-base font-semibold text-foreground truncate">
                  {model.model_name}
                </div>
              </div>
            </div>

            {/* Specs */}
            <div className="divide-y divide-border/50">
              {visibleSpecRows.map((config) => (
                <div
                  key={String(config.key)}
                  className="flex items-center justify-between px-4 py-2.5 text-sm"
                >
                  <span className="text-muted-foreground">
                    {getLabel(config.labelKey, config.defaultLabel)}
                  </span>
                  {renderSpecValue(model, config, selectedModels)}
                </div>
              ))}

              {/* Cost section separator */}
              <div className="px-4 py-2 bg-muted/50 text-xs font-semibold text-foreground uppercase tracking-wide">
                Hinnad ja kulud
              </div>

              {costRows.map((config) => (
                <div
                  key={String(config.key)}
                  className="flex items-center justify-between px-4 py-2.5 text-sm"
                >
                  <span className="text-muted-foreground">
                    {getLabel(config.labelKey, config.defaultLabel)}
                  </span>
                  {renderSpecValue(model, config, selectedModels)}
                </div>
              ))}

              {/* TCO */}
              <div className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold bg-muted/30">
                <span className="text-foreground">TCO (Kogukulu)</span>
                <div className="flex items-center gap-1">
                  <span className={cn(isJohnDeere && "font-semibold")}>
                    {tco !== null ? formatCurrency(tco) : "—"}
                  </span>
                  {isBestTCO && selectedModels.length > 1 && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
