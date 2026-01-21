import { Equipment, CompetitiveArgument, Brand } from "@/types/equipment";
import { Trophy, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DetailedSpecsTableRows } from "./DetailedSpecsTableRows";
import { EditableCell } from "./EditableCell";
import { useUpdateEquipment } from "@/hooks/useEquipmentData";
import { toast } from "sonner";

interface ModelComparisonProps {
  selectedModel: Equipment | null;
  competitors: Equipment[];
  competitiveArgs: CompetitiveArgument[];
  brands: Brand[];
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

function getBrandTextColor(brandName: string): string {
  switch (brandName) {
    case "John Deere":
      return "text-john-deere";
    case "Claas":
      return "text-claas";
    case "Case IH":
      return "text-case-ih";
    case "New Holland":
      return "text-new-holland";
    case "Fendt":
      return "text-fendt";
    default:
      return "text-foreground";
  }
}

// Row configuration for dynamic rendering
interface SpecRowConfig {
  key: keyof Equipment;
  label: string;
  suffix?: string;
  format?: "number" | "currency" | "decimal";
  showJDAdvantage?: boolean;
  isBestFn?: "max" | "min";
  condition?: (models: Equipment[]) => boolean;
}

const SPEC_ROWS: SpecRowConfig[] = [
  { key: "engine_power_hp", label: "Võimsus (hj)", showJDAdvantage: true, isBestFn: "max" },
  { key: "grain_tank_liters", label: "Viljabunker (l)", showJDAdvantage: true, isBestFn: "max" },
  { key: "header_width_m", label: "Heedri laius (m)", format: "decimal", showJDAdvantage: true, isBestFn: "max" },
  { key: "fuel_tank_liters", label: "Kütusepaak (L)", showJDAdvantage: true, isBestFn: "max", condition: (m) => m.some(e => e.fuel_tank_liters) },
  { key: "cleaning_area_m2", label: "Puhasti pindala (m²)", format: "decimal", showJDAdvantage: true, isBestFn: "max", condition: (m) => m.some(e => e.cleaning_area_m2) },
  { key: "rotor_diameter_mm", label: "Rootori läbimõõt (mm)", showJDAdvantage: true, isBestFn: "max", condition: (m) => m.some(e => e.rotor_diameter_mm) },
  { key: "throughput_tons_h", label: "Läbilaskevõime (t/h)", format: "decimal", showJDAdvantage: true, isBestFn: "max", condition: (m) => m.some(e => e.throughput_tons_h) },
  { key: "engine_cylinders", label: "Silindrid", isBestFn: "max", condition: (m) => m.some(e => e.engine_cylinders) },
  { key: "max_torque_nm", label: "Max pöördemoment (Nm)", isBestFn: "max", condition: (m) => m.some(e => e.max_torque_nm) },
  { key: "feeder_width_mm", label: "Etteande laius (mm)", isBestFn: "max", condition: (m) => m.some(e => e.feeder_width_mm) },
  { key: "rotor_length_mm", label: "Rootori pikkus (mm)", isBestFn: "max", condition: (m) => m.some(e => e.rotor_length_mm) },
  { key: "threshing_area_m2", label: "Peksu pindala (m²)", format: "decimal", isBestFn: "max", condition: (m) => m.some(e => e.threshing_area_m2) },
  { key: "separator_area_m2", label: "Eraldaja pindala (m²)", format: "decimal", isBestFn: "max", condition: (m) => m.some(e => e.separator_area_m2) },
  { key: "sieve_area_m2", label: "Sõela pindala (m²)", format: "decimal", isBestFn: "max", condition: (m) => m.some(e => e.sieve_area_m2) },
  { key: "straw_walker_area_m2", label: "Kõrreraputite pindala (m²)", format: "decimal", isBestFn: "max", condition: (m) => m.some(e => e.straw_walker_area_m2) },
  { key: "unloading_rate_ls", label: "Tühjendamiskiirus (l/s)", format: "decimal", isBestFn: "max", condition: (m) => m.some(e => e.unloading_rate_ls) },
  { key: "auger_reach_m", label: "Tigukruvi ulatus (m)", format: "decimal", isBestFn: "max", condition: (m) => m.some(e => e.auger_reach_m) },
  { key: "max_slope_percent", label: "Max kalle (%)", suffix: "%", isBestFn: "max", condition: (m) => m.some(e => e.max_slope_percent) },
  { key: "weight_kg", label: "Kaal (kg)", isBestFn: "min" },
  { key: "fuel_consumption_lh", label: "Kütusekulu (l/h)", format: "decimal", isBestFn: "min" },
];

const COST_ROWS: SpecRowConfig[] = [
  { key: "price_eur", label: "Hind", format: "currency", isBestFn: "min" },
  { key: "annual_maintenance_eur", label: "Hooldus/aastas", format: "currency", isBestFn: "min" },
  { key: "expected_lifespan_years", label: "Eeldatav eluiga", suffix: " aastat", isBestFn: "max" },
];

export function ModelComparison({
  selectedModel,
  competitors,
}: ModelComparisonProps) {
  const updateEquipment = useUpdateEquipment();

  if (!selectedModel) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-lg font-medium text-muted-foreground">
          Vali mudel võrdluseks
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Vali tehnika tüüp, bränd ja mudel, et näha võrdlust konkurentidega samas jõuklassis.
        </p>
      </div>
    );
  }

  const allModels = [selectedModel, ...competitors];

  // Calculate best values for highlighting
  const getBestValue = (key: keyof Equipment, isBestFn: "max" | "min"): number | null => {
    const values = allModels
      .map(m => m[key])
      .filter((v): v is number => typeof v === "number");
    if (values.length === 0) return null;
    return isBestFn === "max" ? Math.max(...values) : Math.min(...values);
  };

  // Handler for saving cell edits
  const handleSaveCell = async (equipmentId: string, field: keyof Equipment, value: number | null) => {
    try {
      await updateEquipment.mutateAsync({
        id: equipmentId,
        [field]: value,
      });
      toast.success("Andmed uuendatud");
    } catch (error) {
      console.error("Failed to update equipment:", error);
      toast.error("Uuendamine ebaõnnestus");
      throw error;
    }
  };

  const selectedTCO = calculateTCO(selectedModel);

  if (competitors.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <Trophy className="h-5 w-5 text-primary" />
          Mudeli võrdlus
        </h3>
        <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
          <p className="text-muted-foreground">
            Samas jõuklassis ({selectedModel.power_class?.name}) konkurente ei leitud.
          </p>
        </div>
      </div>
    );
  }

  // Render a specification row
  const renderSpecRow = (config: SpecRowConfig) => {
    if (config.condition && !config.condition(allModels)) return null;
    
    const bestValue = config.isBestFn ? getBestValue(config.key, config.isBestFn) : null;

    return (
      <tr key={config.key} className="border-b border-border/50">
        <td className="sticky left-0 z-10 bg-card p-3 text-sm text-muted-foreground border-r border-border">
          {config.label}
        </td>
        {allModels.map((model) => {
          const isJohnDeere = model.brand?.name === "John Deere";
          const value = model[config.key] as number | null | undefined;
          const isBest = bestValue !== null && value === bestValue;

          return (
            <td 
              key={model.id} 
              className={cn(
                "p-2 text-center text-sm font-medium",
                model.id === selectedModel.id && "bg-primary/5"
              )}
            >
              <EditableCell
                value={value}
                onSave={(newValue) => handleSaveCell(model.id, config.key, newValue)}
                format={config.format || "number"}
                isBest={isBest && value !== null && value !== undefined}
                isJohnDeere={isJohnDeere}
                suffix={config.suffix}
                showJDAdvantage={config.showJDAdvantage}
                isSelectedModel={model.id === selectedModel.id}
              />
            </td>
          );
        })}
      </tr>
    );
  };

  // Calculate TCO best value
  const tcoValues = allModels
    .map(m => calculateTCO(m))
    .filter((v): v is number => v !== null);
  const bestTCO = tcoValues.length > 0 ? Math.min(...tcoValues) : null;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Trophy className="h-5 w-5 text-primary" />
        Mudeli võrdlus — Jõuklass: {selectedModel.power_class?.name}
        <span className="ml-auto text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
          Kliki lahtril muutmiseks
        </span>
      </h3>

      {/* Comparison Table with sticky header and first column */}
      <div className="relative overflow-x-auto overflow-y-auto max-w-full max-h-[70vh] border border-border rounded-lg">
        <div className="min-w-[800px]">
          <table className="w-full" style={{ borderCollapse: 'collapse', borderSpacing: 0 }}>
            {/* Sticky header with fully opaque white background - no gaps */}
            <thead className="sticky top-0 z-20" style={{ backgroundColor: 'white' }}>
              {/* Model Names Row */}
              <tr style={{ backgroundColor: 'white' }}>
                <th 
                  className="sticky left-0 z-30 p-3 text-left text-sm font-medium text-muted-foreground min-w-[150px] border-b border-r border-border"
                  style={{ backgroundColor: 'white' }}
                >
                  Näitaja
                </th>
                {allModels.map((model, index) => (
                  <th 
                    key={model.id} 
                    className={cn(
                      "p-3 text-center text-sm font-semibold min-w-[160px] border-b border-border",
                      index < allModels.length - 1 && "border-r"
                    )}
                    style={{ 
                      backgroundColor: model.id === selectedModel.id 
                        ? 'hsl(122, 39%, 30%, 0.1)' 
                        : 'white' 
                    }}
                  >
                    <span className={getBrandTextColor(model.brand?.name || "")}>
                      {model.brand?.name}
                    </span>
                    <div className="text-xs text-muted-foreground font-normal mt-1">
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
                {allModels.map((model, index) => (
                  <th 
                    key={model.id} 
                    className={cn(
                      "p-3 text-center border-b border-border",
                      index < allModels.length - 1 && "border-r"
                    )}
                    style={{ 
                      backgroundColor: model.id === selectedModel.id 
                        ? 'hsl(122, 39%, 30%, 0.05)' 
                        : 'white' 
                    }}
                  >
                    {model.image_url ? (
                      <img 
                        src={model.image_url} 
                        alt={model.model_name}
                        className="h-20 w-full rounded-md object-contain mx-auto"
                        style={{ backgroundColor: 'white' }}
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
              {/* Technical Specs */}
              {SPEC_ROWS.map(renderSpecRow)}

              {/* Price Section Header */}
              <tr className="bg-muted/50">
                <td colSpan={allModels.length + 1} className="p-3 text-sm font-semibold text-foreground border-y border-border">
                  HINNAD JA KULUD
                </td>
              </tr>

              {/* Cost Rows */}
              {COST_ROWS.map(renderSpecRow)}

              {/* TCO (calculated, not editable) */}
              <tr className="border-b border-border bg-muted/30">
                <td className="sticky left-0 z-10 bg-muted/30 p-3 text-sm font-semibold text-foreground border-r border-border">
                  TCO (Kogukulu)
                </td>
                {allModels.map((model) => {
                  const isJohnDeere = model.brand?.name === "John Deere";
                  const tco = calculateTCO(model);
                  const isBest = tco === bestTCO;
                  return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-semibold",
                        model.id === selectedModel.id && "bg-primary/5"
                      )}
                    >
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <div className="flex items-center gap-1">
                          <span className={cn(
                            tco === null && "text-muted-foreground/40",
                            isJohnDeere && tco !== null && "font-semibold"
                          )}>
                            {tco === null ? "—" : formatCurrency(tco)}
                          </span>
                          {isBest && tco !== null && <CheckCircle2 className="h-4 w-4 text-success" />}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Savings compared to selected */}
              <tr className="bg-primary/5">
                <td className="sticky left-0 z-10 bg-primary/5 p-3 text-sm font-medium text-foreground border-r border-border">
                  Sääst vs valitud
                </td>
                {allModels.map((model) => {
                  const tco = calculateTCO(model);
                  if (model.id === selectedModel.id || !tco || !selectedTCO) {
                    return (
                      <td 
                        key={model.id} 
                        className="p-3 text-center text-sm text-muted-foreground/40"
                      >
                        —
                      </td>
                    );
                  }
                  const diff = selectedTCO - tco;
                  const isPositive = diff < 0;
                  return (
                    <td 
                      key={model.id} 
                      className="p-3 text-center text-sm font-medium"
                    >
                      <span className={cn(
                        isPositive ? "text-success" : "text-destructive"
                      )}>
                        {isPositive ? "+" : ""}{formatCurrency(Math.abs(diff))}
                      </span>
                    </td>
                  );
                })}
              </tr>

              {/* Detailed Specs (expandable sections) */}
              <DetailedSpecsTableRows 
                allModels={allModels} 
                selectedModelId={selectedModel.id}
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
