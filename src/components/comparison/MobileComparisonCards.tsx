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

  const renderValue = (model: Equipment, config: SpecRowConfig) => {
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
      <div className="flex items-center justify-center gap-1">
        <span className={cn("whitespace-nowrap", isJohnDeere && "font-semibold")}>{displayValue}</span>
        {isBest && selectedModels.length > 1 && <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />}
      </div>
    );
  };

  const visibleSpecRows = specRows.filter(
    (config) =>
      !config.conditional ||
      selectedModels.some(
        (m) => m[config.key] !== null && m[config.key] !== undefined
      )
  );

  const modelColWidth = selectedModels.length === 1 ? "min-w-[140px]" : "min-w-[120px]";

  return (
    <div className="overflow-x-auto -mx-4 px-0">
      <table className="w-full border-collapse text-sm" style={{ minWidth: `${120 + selectedModels.length * 120}px` }}>
        {/* Header: model images + names */}
        <thead className="sticky top-0 z-10">
          <tr className="bg-card">
            <th className="sticky left-0 z-20 bg-card p-2 min-w-[100px] max-w-[120px]" />
            {selectedModels.map((model, i) => (
              <th key={model.id} className={cn("p-2 text-center", modelColWidth, i === 0 && "bg-primary/5")}>
                {model.image_url && (
                  <img
                    src={model.image_url}
                    alt={model.model_name}
                    className="h-12 w-full rounded object-contain bg-white mx-auto mb-1"
                  />
                )}
                <span className={cn("text-[11px] font-bold block leading-tight", getBrandTextColor(model.brand?.name || ""))}>
                  {model.brand?.name}
                </span>
                <div className="text-[11px] font-medium text-foreground leading-tight truncate">
                  {model.model_name}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Spec rows */}
          {visibleSpecRows.map((config) => (
            <tr key={String(config.key)} className="border-t border-border/30">
              <td className="sticky left-0 z-10 bg-card p-2 text-[11px] text-muted-foreground font-medium leading-tight">
                {getLabel(config.labelKey, config.defaultLabel)}
              </td>
              {selectedModels.map((model, i) => (
                <td key={model.id} className={cn("p-2 text-center text-[12px]", i === 0 && "bg-primary/5")}>
                  {renderValue(model, config)}
                </td>
              ))}
            </tr>
          ))}

          {/* Cost section header */}
          <tr className="bg-muted/50">
            <td colSpan={selectedModels.length + 1} className="p-2 text-[11px] font-semibold text-foreground uppercase tracking-wide border-y border-border">
              Hinnad ja kulud
            </td>
          </tr>

          {/* Cost rows */}
          {costRows.map((config) => (
            <tr key={String(config.key)} className="border-t border-border/30">
              <td className="sticky left-0 z-10 bg-card p-2 text-[11px] text-muted-foreground font-medium leading-tight">
                {getLabel(config.labelKey, config.defaultLabel)}
              </td>
              {selectedModels.map((model, i) => (
                <td key={model.id} className={cn("p-2 text-center text-[12px]", i === 0 && "bg-primary/5")}>
                  {renderValue(model, config)}
                </td>
              ))}
            </tr>
          ))}

          {/* TCO row */}
          <tr className="border-t border-border bg-muted/30">
            <td className="sticky left-0 z-10 bg-muted/30 p-2 text-[11px] font-semibold text-foreground leading-tight">
              TCO (Kogukulu)
            </td>
            {selectedModels.map((model, i) => {
              const tco = calculateTCO(model);
              const isBestTCO = tco === bestTCO && tco !== null;
              const isJohnDeere = model.brand?.name === "John Deere";
              return (
                <td key={model.id} className={cn("p-2 text-center text-[12px] font-semibold", i === 0 && "bg-primary/5")}>
                  <div className="flex items-center justify-center gap-1">
                    <span className={cn("whitespace-nowrap", isJohnDeere && "font-semibold")}>
                      {tco !== null ? formatCurrency(tco) : "—"}
                    </span>
                    {isBestTCO && selectedModels.length > 1 && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                    )}
                  </div>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
