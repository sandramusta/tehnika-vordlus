import { Equipment, CompetitiveArgument, Brand } from "@/types/equipment";
import { Trophy, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DetailedSpecsTableRows } from "./DetailedSpecsTableRows";
import { EditableValueCell, EditableCell } from "./EditableCell";
import { useInlineEdit } from "@/hooks/useInlineEdit";
import { useSpecLabels } from "@/hooks/useSpecLabels";
import { toast } from "sonner";
 import { getBrandTextColor, getBrandBgClass } from "@/lib/brandColors";
import { ComparisonMode } from "./ComparisonModeSelector";

interface MultiModelComparisonProps {
  selectedModels: Equipment[];
  equipmentTypeName?: string;
  comparisonMode?: ComparisonMode;
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

function calculateTCO(equipment: Equipment): number | null {
  if (!equipment.price_eur || !equipment.annual_maintenance_eur) return null;
  const lifespan = equipment.expected_lifespan_years || 10;
  return equipment.price_eur + equipment.annual_maintenance_eur * lifespan;
}

function isMissing(value: unknown): boolean {
  return value === null || value === undefined;
}

// Define spec row configurations
interface SpecRowConfig {
  key: keyof Equipment;
  labelKey: string;
  defaultLabel: string;
  format?: "number" | "currency";
  suffix?: string;
  bestType?: "max" | "min";
  showJDAdvantage?: boolean;
  conditional?: boolean;
}

// Combine-specific specs
const COMBINE_SPEC_ROWS: SpecRowConfig[] = [
  { key: "engine_power_hp", labelKey: "engine_power_hp", defaultLabel: "Võimsus (hj)", bestType: "max", showJDAdvantage: true },
  { key: "grain_tank_liters", labelKey: "grain_tank_liters", defaultLabel: "Viljabunker (l)", bestType: "max", showJDAdvantage: true },
  { key: "header_width_m", labelKey: "header_width_m", defaultLabel: "Heedri laius (m)", bestType: "max", showJDAdvantage: true },
  { key: "fuel_tank_liters", labelKey: "fuel_tank_liters", defaultLabel: "Kütusepaak (L)", bestType: "max", showJDAdvantage: true, conditional: true },
  { key: "cleaning_area_m2", labelKey: "cleaning_area_m2", defaultLabel: "Puhasti pindala (m²)", bestType: "max", showJDAdvantage: true, conditional: true },
  { key: "rotor_diameter_mm", labelKey: "rotor_diameter_mm", defaultLabel: "Rootori läbimõõt (mm)", bestType: "max", showJDAdvantage: true, conditional: true },
  { key: "throughput_tons_h", labelKey: "throughput_tons_h", defaultLabel: "Läbilaskevõime (t/h)", bestType: "max", showJDAdvantage: true, conditional: true },
  { key: "engine_cylinders", labelKey: "engine_cylinders", defaultLabel: "Silindrid", bestType: "max", conditional: true },
  { key: "max_torque_nm", labelKey: "max_torque_nm", defaultLabel: "Max pöördemoment (Nm)", bestType: "max", conditional: true },
  { key: "feeder_width_mm", labelKey: "feeder_width_mm", defaultLabel: "Etteande laius (mm)", bestType: "max", conditional: true },
  { key: "rotor_length_mm", labelKey: "rotor_length_mm", defaultLabel: "Rootori pikkus (mm)", bestType: "max", conditional: true },
  { key: "threshing_area_m2", labelKey: "threshing_area_m2", defaultLabel: "Peksu pindala (m²)", bestType: "max", conditional: true },
  { key: "separator_area_m2", labelKey: "separator_area_m2", defaultLabel: "Eraldaja pindala (m²)", bestType: "max", conditional: true },
  { key: "sieve_area_m2", labelKey: "sieve_area_m2", defaultLabel: "Sõela pindala (m²)", bestType: "max", conditional: true },
  { key: "straw_walker_area_m2", labelKey: "straw_walker_area_m2", defaultLabel: "Kõrreraputite pindala (m²)", bestType: "max", conditional: true },
  { key: "unloading_rate_ls", labelKey: "unloading_rate_ls", defaultLabel: "Tühjendamiskiirus (l/s)", bestType: "max", conditional: true },
  { key: "auger_reach_m", labelKey: "auger_reach_m", defaultLabel: "Tigukruvi ulatus (m)", bestType: "max", conditional: true },
  { key: "max_slope_percent", labelKey: "max_slope_percent", defaultLabel: "Max kalle (%)", suffix: "%", bestType: "max", conditional: true },
  { key: "weight_kg", labelKey: "weight_kg", defaultLabel: "Kaal (kg)", bestType: "min" },
  { key: "fuel_consumption_lh", labelKey: "fuel_consumption_lh", defaultLabel: "Kütusekulu (l/h)", bestType: "min" },
];

// Telehandler-specific specs - all 8 required indicators
const TELEHANDLER_SPEC_ROWS: SpecRowConfig[] = [
  { key: "lift_height_m", labelKey: "lift_height_m", defaultLabel: "Tõstekõrgus (m)", bestType: "max", showJDAdvantage: true },
  { key: "lift_reach_m", labelKey: "lift_reach_m", defaultLabel: "Tõste kaugus (m)", bestType: "max", showJDAdvantage: true },
  { key: "max_lift_capacity_kg", labelKey: "max_lift_capacity_kg", defaultLabel: "Max tõstevõime (kg)", bestType: "max", showJDAdvantage: true },
  { key: "weight_kg", labelKey: "weight_kg", defaultLabel: "Masina mass (kg)", bestType: "min" },
  { key: "transport_width_mm", labelKey: "transport_width_mm", defaultLabel: "Laius (mm)", bestType: "min" },
  { key: "transport_height_mm", labelKey: "transport_height_mm", defaultLabel: "Kõrgus (mm)", bestType: "min" },
  { key: "engine_power_hp", labelKey: "engine_power_hp", defaultLabel: "Mootori võimsus (hj)", bestType: "max" },
  { key: "hydraulic_pump_lpm", labelKey: "hydraulic_pump_lpm", defaultLabel: "Hüdraulikapumba võimsus (l/min)", bestType: "max" },
];

// Generic specs for other equipment types
const GENERIC_SPEC_ROWS: SpecRowConfig[] = [
  { key: "engine_power_hp", labelKey: "engine_power_hp", defaultLabel: "Võimsus (hj)", bestType: "max", showJDAdvantage: true },
  { key: "weight_kg", labelKey: "weight_kg", defaultLabel: "Kaal (kg)", bestType: "min" },
  { key: "fuel_consumption_lh", labelKey: "fuel_consumption_lh", defaultLabel: "Kütusekulu (l/h)", bestType: "min", conditional: true },
];

function getSpecRowsForEquipmentType(typeName?: string): SpecRowConfig[] {
  switch (typeName) {
    case "telehandler":
      return TELEHANDLER_SPEC_ROWS;
    case "combine":
      return COMBINE_SPEC_ROWS;
    default:
      return GENERIC_SPEC_ROWS;
  }
}

const COST_ROWS: SpecRowConfig[] = [
  { key: "price_eur", labelKey: "price_eur", defaultLabel: "Hind", format: "currency", bestType: "min" },
  { key: "annual_maintenance_eur", labelKey: "annual_maintenance_eur", defaultLabel: "Hooldus/aastas", format: "currency", bestType: "min" },
  { key: "expected_lifespan_years", labelKey: "expected_lifespan_years", defaultLabel: "Eeldatav eluiga", suffix: " aastat", bestType: "max" },
];

export function MultiModelComparison({ selectedModels, equipmentTypeName, comparisonMode }: MultiModelComparisonProps) {
  const { data: specLabels = {} } = useSpecLabels();
  const inlineEdit = useInlineEdit({
    onSuccess: () => toast.success("Salvestatud"),
    onError: (error) => toast.error(`Viga: ${error.message}`),
  });

  if (selectedModels.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-lg font-medium text-muted-foreground">
          Vali mudelid võrdluseks
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {comparisonMode === "auto"
            ? "Vali tehnika tüüp ja süsteem leiab automaatselt konkurendid."
            : "Vali tehnika tüüp ja seejärel 1–3 mudelit, mida soovid võrrelda."
          }
        </p>
      </div>
    );
  }

  // Calculate best values for highlighting
  const calculateBestValue = (key: keyof Equipment, type: "max" | "min"): number => {
    const values = selectedModels
      .map((m) => m[key] as number | null)
      .filter((v): v is number => v !== null && v !== undefined);
    if (values.length === 0) return type === "max" ? -Infinity : Infinity;
    return type === "max" ? Math.max(...values) : Math.min(...values);
  };

  const bestTCO = Math.min(
    ...selectedModels.filter((m) => calculateTCO(m)).map((m) => calculateTCO(m)!)
  );

  const getLabel = (labelKey: string, defaultLabel: string): string => {
    return specLabels[labelKey] || defaultLabel;
  };

  const handleLabelSave = (labelKey: string) => {
    inlineEdit.saveSpecLabel(labelKey, inlineEdit.editValue);
  };

  const handleValueSave = (modelId: string, fieldKey: keyof Equipment) => {
    inlineEdit.saveTopLevelField(modelId, fieldKey, inlineEdit.editValue);
  };

  const renderSpecRow = (config: SpecRowConfig) => {
    const { key, labelKey, defaultLabel, format, suffix = "", bestType, showJDAdvantage, conditional } = config;

    // Skip conditional rows if no model has the value
    if (conditional && !selectedModels.some((m) => m[key] !== null && m[key] !== undefined)) {
      return null;
    }

    const bestValue = bestType ? calculateBestValue(key, bestType) : null;
    const label = getLabel(labelKey, defaultLabel);
    const cellIdLabel = `label-${labelKey}`;

    return (
      <tr key={key} className="border-b border-border/50">
        <td className="sticky left-0 z-10 bg-card p-3 text-sm text-muted-foreground border-r border-border">
          <EditableCell
            value={label}
            cellId={cellIdLabel}
            editingCell={inlineEdit.editingCell}
            editValue={inlineEdit.editValue}
            onStartEdit={inlineEdit.startEditing}
            onValueChange={inlineEdit.setEditValue}
            onSave={() => handleLabelSave(labelKey)}
            onCancel={inlineEdit.cancelEditing}
            isLabel
          />
        </td>
        {selectedModels.map((model) => {
          const isJohnDeere = model.brand?.name === "John Deere";
          const value = model[key] as number | null;
          const isBest = bestValue !== null && value === bestValue && value !== null;
          const cellId = `${model.id}-${key}`;

          const displayValue =
            format === "currency"
              ? formatCurrency(value)
              : isMissing(value)
              ? "—"
              : `${formatNumber(value)}${suffix}`;

          return (
            <td
              key={model.id}
              className={cn(
                "p-3 text-center text-sm font-medium",
                selectedModels.indexOf(model) === 0 && "bg-primary/5"
              )}
            >
              <EditableValueCell
                displayValue={displayValue}
                rawValue={value}
                cellId={cellId}
                editingCell={inlineEdit.editingCell}
                editValue={inlineEdit.editValue}
                onStartEdit={inlineEdit.startEditing}
                onValueChange={inlineEdit.setEditValue}
                onSave={() => handleValueSave(model.id, key)}
                onCancel={inlineEdit.cancelEditing}
              >
                <div className="flex items-center justify-center gap-1">
                  <span className={cn(isJohnDeere && "font-semibold")}>
                    {displayValue}
                  </span>
                  {isBest && <CheckCircle2 className="h-4 w-4 text-success" />}
                </div>
                {showJDAdvantage && isJohnDeere && isBest && (
                  <span className="text-[10px] font-medium uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    JD eelis
                  </span>
                )}
              </EditableValueCell>
            </td>
          );
        })}
      </tr>
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Trophy className="h-5 w-5 text-primary" />
        Võrdlustabel ({selectedModels.length} mudelit)
      </h3>

      {/* Comparison Table with sticky header and first column */}
      <div className="relative overflow-x-auto overflow-y-auto max-w-full max-h-[70vh] border border-border rounded-lg">
        <div className="min-w-[600px]">
          <table className="w-full" style={{ borderCollapse: 'collapse', borderSpacing: 0 }}>
            {/* Sticky header with fully opaque white background */}
            <thead className="sticky top-0 z-20" style={{ backgroundColor: 'white' }}>
              {/* Model Names Row */}
              <tr style={{ backgroundColor: 'white' }}>
                <th 
                  className="sticky left-0 z-30 p-3 text-left text-sm font-medium text-muted-foreground min-w-[150px] border-b border-r border-border"
                  style={{ backgroundColor: 'white' }}
                >
                  Näitaja
                </th>
                {selectedModels.map((model, index) => (
                  <th 
                    key={model.id} 
                    className={cn(
                      "p-4 text-center min-w-[180px] border-b border-border rounded-t-lg",
                      index < selectedModels.length - 1 && "border-r",
                      index === 0 ? "bg-primary/5" : "bg-white"
                    )}
                  >
                    <span className={cn(
                      "text-base font-bold block",
                      getBrandTextColor(model.brand?.name || "")
                    )}>
                      {model.brand?.name}
                    </span>
                    <div className="text-sm font-medium mt-1 text-foreground">
                      {model.model_name}
                    </div>
                  </th>
                ))}
              </tr>
              {/* Model Images Row */}
              <tr style={{ backgroundColor: 'white' }}>
                <th 
                  className="sticky left-0 z-30 p-3 text-sm text-muted-foreground border-b border-r border-border"
                  style={{ backgroundColor: 'white' }}
                ></th>
                {selectedModels.map((model, index) => (
                  <th 
                    key={model.id} 
                    className={cn(
                      "p-3 text-center border-b border-border",
                      index < selectedModels.length - 1 && "border-r",
                      index === 0 && "bg-primary/5"
                    )}
                    style={{ backgroundColor: index === 0 ? undefined : 'white' }}
                  >
                    {model.image_url ? (
                      <img 
                        src={model.image_url} 
                        alt={model.model_name}
                        className="h-20 w-full rounded-md object-contain mx-auto"
                        style={{ backgroundColor: index === 0 ? 'transparent' : 'white' }}
                      />
                    ) : (
                      <div className="h-20 w-full rounded-md bg-muted/30 flex items-center justify-center text-muted-foreground text-xs">
                        Pilt puudub
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Technical Spec Rows - based on equipment type */}
              {getSpecRowsForEquipmentType(equipmentTypeName).map((config) => renderSpecRow(config))}

              {/* Price Section Header */}
              <tr className="bg-muted/50">
                <td colSpan={selectedModels.length + 1} className="p-3 text-sm font-semibold text-foreground border-y border-border">
                  HINNAD JA KULUD
                </td>
              </tr>

              {/* Cost Rows */}
              {COST_ROWS.map((config) => renderSpecRow(config))}

              {/* TCO (Calculated - Read Only) */}
              <tr className="border-b border-border bg-muted/30">
                <td className="sticky left-0 z-10 bg-muted/30 p-3 text-sm font-semibold text-foreground border-r border-border">
                  TCO (Kogukulu)
                </td>
                {selectedModels.map((model, index) => {
                  const isJohnDeere = model.brand?.name === "John Deere";
                  const tco = calculateTCO(model);
                  const isBest = tco === bestTCO && tco !== null;
                    return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-semibold",
                        index === 0 && "bg-primary/5"
                      )}
                    >
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <div className="flex items-center gap-1">
                          <span className={cn(isJohnDeere && "font-semibold")}>
                            {tco !== null ? formatCurrency(tco) : "—"}
                          </span>
                          {isBest && <CheckCircle2 className="h-4 w-4 text-success" />}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Detailed Specs (expandable sections) */}
              <DetailedSpecsTableRows 
                allModels={selectedModels} 
                selectedModelId={selectedModels[0]?.id || ""}
                equipmentTypeName={equipmentTypeName}
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
