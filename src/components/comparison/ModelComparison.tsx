import { Equipment, CompetitiveArgument, Brand } from "@/types/equipment";
import { Trophy, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DetailedSpecsTableRows } from "./DetailedSpecsTableRows";

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
      return "text-primary";
    case "Claas":
      return "text-claas";
    case "Case IH":
      return "text-case-ih";
    case "New Holland":
      return "text-new-holland";
    default:
      return "text-foreground";
  }
}

// Helper to check if value is missing (null or undefined)
function isMissing(value: unknown): boolean {
  return value === null || value === undefined;
}

// Cell value component that grays out missing data and shows JD advantage
function CellValue({ 
  value, 
  format = "number", 
  isBest = false,
  isJohnDeere = false,
  suffix = "",
  showJDAdvantage = false
}: { 
  value: number | null | undefined; 
  format?: "number" | "currency";
  isBest?: boolean;
  isJohnDeere?: boolean;
  suffix?: string;
  showJDAdvantage?: boolean;
}) {
  const missing = isMissing(value);
  
  if (missing) {
    return <span className={cn("text-muted-foreground/40")}>—</span>;
  }

  const formatted = format === "currency" 
    ? formatCurrency(value as number) 
    : `${formatNumber(value as number)}${suffix}`;

  return (
    <div className="flex flex-col items-center justify-center gap-0.5">
      <div className="flex items-center gap-1">
        <span className={cn(isJohnDeere && "font-semibold")}>{formatted}</span>
        {isBest && <CheckCircle2 className="h-4 w-4 text-success" />}
      </div>
      {showJDAdvantage && isJohnDeere && isBest && (
        <span className="text-[10px] font-medium uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded">
          JD eelis
        </span>
      )}
    </div>
  );
}

export function ModelComparison({
  selectedModel,
  competitors,
}: ModelComparisonProps) {
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
  const bestValues = {
    power: Math.max(...allModels.filter(m => m.engine_power_hp).map(m => m.engine_power_hp!)),
    tank: Math.max(...allModels.filter(m => m.grain_tank_liters).map(m => m.grain_tank_liters!)),
    headerWidth: Math.max(...allModels.filter(m => m.header_width_m).map(m => m.header_width_m!)),
    lowestWeight: Math.min(...allModels.filter(m => m.weight_kg).map(m => m.weight_kg!)),
    lowestFuel: Math.min(...allModels.filter(m => m.fuel_consumption_lh).map(m => m.fuel_consumption_lh!)),
    lowestPrice: Math.min(...allModels.filter(m => m.price_eur).map(m => m.price_eur!)),
    lowestMaintenance: Math.min(...allModels.filter(m => m.annual_maintenance_eur).map(m => m.annual_maintenance_eur!)),
    lowestTCO: Math.min(...allModels.filter(m => calculateTCO(m)).map(m => calculateTCO(m)!)),
    highestLifespan: Math.max(...allModels.map(m => m.expected_lifespan_years || 10)),
    // Technical specs from brochures
    fuelTank: Math.max(...allModels.filter(m => m.fuel_tank_liters).map(m => m.fuel_tank_liters!)),
    cleaningArea: Math.max(...allModels.filter(m => m.cleaning_area_m2).map(m => m.cleaning_area_m2!)),
    rotorDiameter: Math.max(...allModels.filter(m => m.rotor_diameter_mm).map(m => m.rotor_diameter_mm!)),
    throughput: Math.max(...allModels.filter(m => m.throughput_tons_h).map(m => m.throughput_tons_h!)),
    engineDisplacement: Math.max(...allModels.filter(m => m.engine_displacement_liters).map(m => m.engine_displacement_liters!)),
    // New detailed specs
    engineCylinders: Math.max(...allModels.filter(m => m.engine_cylinders).map(m => m.engine_cylinders!)),
    maxTorque: Math.max(...allModels.filter(m => m.max_torque_nm).map(m => m.max_torque_nm!)),
    feederWidth: Math.max(...allModels.filter(m => m.feeder_width_mm).map(m => m.feeder_width_mm!)),
    rotorLength: Math.max(...allModels.filter(m => m.rotor_length_mm).map(m => m.rotor_length_mm!)),
    separatorArea: Math.max(...allModels.filter(m => m.separator_area_m2).map(m => m.separator_area_m2!)),
    sieveArea: Math.max(...allModels.filter(m => m.sieve_area_m2).map(m => m.sieve_area_m2!)),
    unloadingRate: Math.max(...allModels.filter(m => m.unloading_rate_ls).map(m => m.unloading_rate_ls!)),
    augerReach: Math.max(...allModels.filter(m => m.auger_reach_m).map(m => m.auger_reach_m!)),
    maxSlope: Math.max(...allModels.filter(m => m.max_slope_percent).map(m => m.max_slope_percent!)),
    strawWalkerArea: Math.max(...allModels.filter(m => m.straw_walker_area_m2).map(m => m.straw_walker_area_m2!)),
    threshingArea: Math.max(...allModels.filter(m => m.threshing_area_m2).map(m => m.threshing_area_m2!)),
    headerWidthMax: Math.max(...allModels.filter(m => m.header_width_max_m).map(m => m.header_width_max_m!)),
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

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Trophy className="h-5 w-5 text-primary" />
        Mudeli võrdlus — Jõuklass: {selectedModel.power_class?.name}
      </h3>

      {/* Comparison Table with sticky header and first column */}
      <div className="relative overflow-x-auto overflow-y-auto max-w-full max-h-[70vh] border border-border rounded-lg">
        <div className="min-w-[800px]">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-20">
              {/* Model Names Row */}
              <tr className="border-b border-border">
                <th className="sticky left-0 z-30 bg-muted p-3 text-left text-sm font-medium text-muted-foreground min-w-[150px] border-r border-border">
                  Näitaja
                </th>
                {allModels.map((model) => (
                  <th 
                    key={model.id} 
                    className={cn(
                      "p-3 text-center text-sm font-semibold min-w-[160px]",
                      model.id === selectedModel.id ? "bg-primary/10" : "bg-muted"
                    )}
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
              {/* Model Images Row - Part of sticky header */}
              <tr className="border-b border-border">
                <th className="sticky left-0 z-30 bg-card p-3 text-sm text-muted-foreground border-r border-border"></th>
                {allModels.map((model) => (
                  <th 
                    key={model.id} 
                    className={cn(
                      "p-3 text-center",
                      model.id === selectedModel.id ? "bg-primary/5" : "bg-card"
                    )}
                  >
                    {model.image_url ? (
                      <img 
                        src={model.image_url} 
                        alt={model.model_name}
                        className="h-20 w-full rounded-md object-contain bg-white mx-auto"
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

              {/* Engine Power */}
              <tr className="border-b border-border/50">
                <td className="sticky left-0 z-10 bg-card p-3 text-sm text-muted-foreground border-r border-border">Võimsus (hj)</td>
                {allModels.map((model) => {
                  const isJohnDeere = model.brand?.name === "John Deere";
                  const isBest = model.engine_power_hp === bestValues.power;
                  return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-medium",
                        model.id === selectedModel.id && "bg-primary/5"
                      )}
                    >
                      <CellValue 
                        value={model.engine_power_hp} 
                        isBest={isBest && !!model.engine_power_hp}
                        isJohnDeere={isJohnDeere}
                        showJDAdvantage={true}
                      />
                    </td>
                  );
                })}
              </tr>

              {/* Grain Tank */}
              <tr className="border-b border-border/50">
                <td className="sticky left-0 z-10 bg-card p-3 text-sm text-muted-foreground border-r border-border">Viljabunker (l)</td>
                {allModels.map((model) => {
                  const isJohnDeere = model.brand?.name === "John Deere";
                  const isBest = model.grain_tank_liters === bestValues.tank;
                  return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-medium",
                        model.id === selectedModel.id && "bg-primary/5"
                      )}
                    >
                      <CellValue 
                        value={model.grain_tank_liters} 
                        isBest={isBest && !!model.grain_tank_liters}
                        isJohnDeere={isJohnDeere}
                        showJDAdvantage={true}
                      />
                    </td>
                  );
                })}
              </tr>

              {/* Header Width */}
              <tr className="border-b border-border/50">
                <td className="sticky left-0 z-10 bg-card p-3 text-sm text-muted-foreground border-r border-border">Heedri laius (m)</td>
                {allModels.map((model) => {
                  const isJohnDeere = model.brand?.name === "John Deere";
                  const isBest = model.header_width_m === bestValues.headerWidth;
                  return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-medium",
                        model.id === selectedModel.id && "bg-primary/5"
                      )}
                    >
                      <CellValue 
                        value={model.header_width_m} 
                        isBest={isBest && !!model.header_width_m}
                        isJohnDeere={isJohnDeere}
                        showJDAdvantage={true}
                      />
                    </td>
                  );
                })}
              </tr>

              {/* Fuel Tank */}
              {allModels.some(m => m.fuel_tank_liters) && (
                <tr className="border-b border-border/50">
                  <td className="sticky left-0 z-10 bg-card p-3 text-sm text-muted-foreground border-r border-border">Kütusepaak (L)</td>
                  {allModels.map((model) => {
                    const isJohnDeere = model.brand?.name === "John Deere";
                    const isBest = model.fuel_tank_liters === bestValues.fuelTank;
                    return (
                      <td 
                        key={model.id} 
                        className={cn(
                          "p-3 text-center text-sm font-medium",
                          model.id === selectedModel.id && "bg-primary/5"
                        )}
                      >
                        <CellValue 
                          value={model.fuel_tank_liters} 
                          isBest={isBest && !!model.fuel_tank_liters}
                          isJohnDeere={isJohnDeere}
                          showJDAdvantage={true}
                        />
                      </td>
                    );
                  })}
                </tr>
              )}

              {/* Cleaning Area */}
              {allModels.some(m => m.cleaning_area_m2) && (
                <tr className="border-b border-border/50">
                  <td className="sticky left-0 z-10 bg-card p-3 text-sm text-muted-foreground border-r border-border">Puhasti pindala (m²)</td>
                  {allModels.map((model) => {
                    const isJohnDeere = model.brand?.name === "John Deere";
                    const isBest = model.cleaning_area_m2 === bestValues.cleaningArea;
                    return (
                      <td 
                        key={model.id} 
                        className={cn(
                          "p-3 text-center text-sm font-medium",
                          model.id === selectedModel.id && "bg-primary/5"
                        )}
                      >
                        <CellValue 
                          value={model.cleaning_area_m2} 
                          isBest={isBest && !!model.cleaning_area_m2}
                          isJohnDeere={isJohnDeere}
                          showJDAdvantage={true}
                        />
                      </td>
                    );
                  })}
                </tr>
              )}

              {/* Rotor Diameter */}
              {allModels.some(m => m.rotor_diameter_mm) && (
                <tr className="border-b border-border/50">
                  <td className="sticky left-0 z-10 bg-card p-3 text-sm text-muted-foreground border-r border-border">Rootori läbimõõt (mm)</td>
                  {allModels.map((model) => {
                    const isJohnDeere = model.brand?.name === "John Deere";
                    const isBest = model.rotor_diameter_mm === bestValues.rotorDiameter;
                    return (
                      <td 
                        key={model.id} 
                        className={cn(
                          "p-3 text-center text-sm font-medium",
                          model.id === selectedModel.id && "bg-primary/5"
                        )}
                      >
                        <CellValue 
                          value={model.rotor_diameter_mm} 
                          isBest={isBest && !!model.rotor_diameter_mm}
                          isJohnDeere={isJohnDeere}
                          showJDAdvantage={true}
                        />
                      </td>
                    );
                  })}
                </tr>
              )}

              {/* Throughput */}
              {allModels.some(m => m.throughput_tons_h) && (
                <tr className="border-b border-border/50">
                  <td className="sticky left-0 z-10 bg-card p-3 text-sm text-muted-foreground border-r border-border">Läbilaskevõime (t/h)</td>
                  {allModels.map((model) => {
                    const isJohnDeere = model.brand?.name === "John Deere";
                    const isBest = model.throughput_tons_h === bestValues.throughput;
                    return (
                      <td 
                        key={model.id} 
                        className={cn(
                          "p-3 text-center text-sm font-medium",
                          model.id === selectedModel.id && "bg-primary/5"
                        )}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {isMissing(model.throughput_tons_h) ? (
                            <span className="text-muted-foreground/40">—</span>
                          ) : (
                            <>
                              <span className={cn(isJohnDeere && "font-semibold")}>{`>${model.throughput_tons_h}`}</span>
                              {isBest && <CheckCircle2 className="h-4 w-4 text-success" />}
                            </>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              )}

              {/* Engine Cylinders */}
              {allModels.some(m => m.engine_cylinders) && (
                <tr className="border-b border-border/50">
                  <td className="sticky left-0 z-10 bg-card p-3 text-sm text-muted-foreground border-r border-border">Silindrid</td>
                  {allModels.map((model) => {
                    const isJohnDeere = model.brand?.name === "John Deere";
                    const isBest = model.engine_cylinders === bestValues.engineCylinders;
                    return (
                      <td 
                        key={model.id} 
                        className={cn(
                          "p-3 text-center text-sm font-medium",
                          model.id === selectedModel.id && "bg-primary/5"
                        )}
                      >
                        <CellValue 
                          value={model.engine_cylinders} 
                          isBest={isBest && !!model.engine_cylinders}
                          isJohnDeere={isJohnDeere}
                        />
                      </td>
                    );
                  })}
                </tr>
              )}

              {/* Max Torque */}
              {allModels.some(m => m.max_torque_nm) && (
                <tr className="border-b border-border/50">
                  <td className="sticky left-0 z-10 bg-card p-3 text-sm text-muted-foreground border-r border-border">Max pöördemoment (Nm)</td>
                  {allModels.map((model) => {
                    const isJohnDeere = model.brand?.name === "John Deere";
                    const isBest = model.max_torque_nm === bestValues.maxTorque;
                    return (
                      <td 
                        key={model.id} 
                        className={cn(
                          "p-3 text-center text-sm font-medium",
                          model.id === selectedModel.id && "bg-primary/5"
                        )}
                      >
                        <CellValue 
                          value={model.max_torque_nm} 
                          isBest={isBest && !!model.max_torque_nm}
                          isJohnDeere={isJohnDeere}
                        />
                      </td>
                    );
                  })}
                </tr>
              )}

              {/* Feeder Width */}
              {allModels.some(m => m.feeder_width_mm) && (
                <tr className="border-b border-border/50">
                  <td className="sticky left-0 z-10 bg-card p-3 text-sm text-muted-foreground border-r border-border">Etteande laius (mm)</td>
                  {allModels.map((model) => {
                    const isJohnDeere = model.brand?.name === "John Deere";
                    const isBest = model.feeder_width_mm === bestValues.feederWidth;
                    return (
                      <td 
                        key={model.id} 
                        className={cn(
                          "p-3 text-center text-sm font-medium",
                          model.id === selectedModel.id && "bg-primary/5"
                        )}
                      >
                        <CellValue 
                          value={model.feeder_width_mm} 
                          isBest={isBest && !!model.feeder_width_mm}
                          isJohnDeere={isJohnDeere}
                        />
                      </td>
                    );
                  })}
                </tr>
              )}

              {/* Rotor Length */}
              {allModels.some(m => m.rotor_length_mm) && (
                <tr className="border-b border-border/50">
                  <td className="sticky left-0 z-10 bg-card p-3 text-sm text-muted-foreground border-r border-border">Rootori pikkus (mm)</td>
                  {allModels.map((model) => {
                    const isJohnDeere = model.brand?.name === "John Deere";
                    const isBest = model.rotor_length_mm === bestValues.rotorLength;
                    return (
                      <td 
                        key={model.id} 
                        className={cn(
                          "p-3 text-center text-sm font-medium",
                          model.id === selectedModel.id && "bg-primary/5"
                        )}
                      >
                        <CellValue 
                          value={model.rotor_length_mm} 
                          isBest={isBest && !!model.rotor_length_mm}
                          isJohnDeere={isJohnDeere}
                        />
                      </td>
                    );
                  })}
                </tr>
              )}

              {/* Threshing Area */}
              {allModels.some(m => m.threshing_area_m2) && (
                <tr className="border-b border-border/50">
                  <td className="sticky left-0 z-10 bg-card p-3 text-sm text-muted-foreground border-r border-border">Peksu pindala (m²)</td>
                  {allModels.map((model) => {
                    const isJohnDeere = model.brand?.name === "John Deere";
                    const isBest = model.threshing_area_m2 === bestValues.threshingArea;
                    return (
                      <td 
                        key={model.id} 
                        className={cn(
                          "p-3 text-center text-sm font-medium",
                          model.id === selectedModel.id && "bg-primary/5"
                        )}
                      >
                        <CellValue 
                          value={model.threshing_area_m2} 
                          isBest={isBest && !!model.threshing_area_m2}
                          isJohnDeere={isJohnDeere}
                        />
                      </td>
                    );
                  })}
                </tr>
              )}

              {/* Separator Area */}
              {allModels.some(m => m.separator_area_m2) && (
                <tr className="border-b border-border/50">
                  <td className="sticky left-0 z-10 bg-card p-3 text-sm text-muted-foreground border-r border-border">Eraldaja pindala (m²)</td>
                  {allModels.map((model) => {
                    const isJohnDeere = model.brand?.name === "John Deere";
                    const isBest = model.separator_area_m2 === bestValues.separatorArea;
                    return (
                      <td 
                        key={model.id} 
                        className={cn(
                          "p-3 text-center text-sm font-medium",
                          model.id === selectedModel.id && "bg-primary/5"
                        )}
                      >
                        <CellValue 
                          value={model.separator_area_m2} 
                          isBest={isBest && !!model.separator_area_m2}
                          isJohnDeere={isJohnDeere}
                        />
                      </td>
                    );
                  })}
                </tr>
              )}

              {/* Sieve Area */}
              {allModels.some(m => m.sieve_area_m2) && (
                <tr className="border-b border-border/50">
                  <td className="sticky left-0 z-10 bg-card p-3 text-sm text-muted-foreground border-r border-border">Sõela pindala (m²)</td>
                  {allModels.map((model) => {
                    const isJohnDeere = model.brand?.name === "John Deere";
                    const isBest = model.sieve_area_m2 === bestValues.sieveArea;
                    return (
                      <td 
                        key={model.id} 
                        className={cn(
                          "p-3 text-center text-sm font-medium",
                          model.id === selectedModel.id && "bg-primary/5"
                        )}
                      >
                        <CellValue 
                          value={model.sieve_area_m2} 
                          isBest={isBest && !!model.sieve_area_m2}
                          isJohnDeere={isJohnDeere}
                        />
                      </td>
                    );
                  })}
                </tr>
              )}

              {/* Straw Walker Area */}
              {allModels.some(m => m.straw_walker_area_m2) && (
                <tr className="border-b border-border/50">
                  <td className="sticky left-0 z-10 bg-card p-3 text-sm text-muted-foreground border-r border-border">Kõrreraputite pindala (m²)</td>
                  {allModels.map((model) => {
                    const isJohnDeere = model.brand?.name === "John Deere";
                    const isBest = model.straw_walker_area_m2 === bestValues.strawWalkerArea;
                    return (
                      <td 
                        key={model.id} 
                        className={cn(
                          "p-3 text-center text-sm font-medium",
                          model.id === selectedModel.id && "bg-primary/5"
                        )}
                      >
                        <CellValue 
                          value={model.straw_walker_area_m2} 
                          isBest={isBest && !!model.straw_walker_area_m2}
                          isJohnDeere={isJohnDeere}
                        />
                      </td>
                    );
                  })}
                </tr>
              )}

              {/* Unloading Rate */}
              {allModels.some(m => m.unloading_rate_ls) && (
                <tr className="border-b border-border/50">
                  <td className="sticky left-0 z-10 bg-card p-3 text-sm text-muted-foreground border-r border-border">Tühjendamiskiirus (l/s)</td>
                  {allModels.map((model) => {
                    const isJohnDeere = model.brand?.name === "John Deere";
                    const isBest = model.unloading_rate_ls === bestValues.unloadingRate;
                    return (
                      <td 
                        key={model.id} 
                        className={cn(
                          "p-3 text-center text-sm font-medium",
                          model.id === selectedModel.id && "bg-primary/5"
                        )}
                      >
                        <CellValue 
                          value={model.unloading_rate_ls} 
                          isBest={isBest && !!model.unloading_rate_ls}
                          isJohnDeere={isJohnDeere}
                        />
                      </td>
                    );
                  })}
                </tr>
              )}

              {/* Auger Reach */}
              {allModels.some(m => m.auger_reach_m) && (
                <tr className="border-b border-border/50">
                  <td className="sticky left-0 z-10 bg-card p-3 text-sm text-muted-foreground border-r border-border">Tigukruvi ulatus (m)</td>
                  {allModels.map((model) => {
                    const isJohnDeere = model.brand?.name === "John Deere";
                    const isBest = model.auger_reach_m === bestValues.augerReach;
                    return (
                      <td 
                        key={model.id} 
                        className={cn(
                          "p-3 text-center text-sm font-medium",
                          model.id === selectedModel.id && "bg-primary/5"
                        )}
                      >
                        <CellValue 
                          value={model.auger_reach_m} 
                          isBest={isBest && !!model.auger_reach_m}
                          isJohnDeere={isJohnDeere}
                        />
                      </td>
                    );
                  })}
                </tr>
              )}

              {/* Max Slope */}
              {allModels.some(m => m.max_slope_percent) && (
                <tr className="border-b border-border/50">
                  <td className="sticky left-0 z-10 bg-card p-3 text-sm text-muted-foreground border-r border-border">Max kalle (%)</td>
                  {allModels.map((model) => {
                    const isJohnDeere = model.brand?.name === "John Deere";
                    const isBest = model.max_slope_percent === bestValues.maxSlope;
                    return (
                      <td 
                        key={model.id} 
                        className={cn(
                          "p-3 text-center text-sm font-medium",
                          model.id === selectedModel.id && "bg-primary/5"
                        )}
                      >
                        <CellValue 
                          value={model.max_slope_percent} 
                          isBest={isBest && !!model.max_slope_percent}
                          isJohnDeere={isJohnDeere}
                          suffix="%"
                        />
                      </td>
                    );
                  })}
                </tr>
              )}

              {/* Weight */}
              <tr className="border-b border-border/50">
                <td className="sticky left-0 z-10 bg-card p-3 text-sm text-muted-foreground border-r border-border">Kaal (kg)</td>
                {allModels.map((model) => {
                  const isJohnDeere = model.brand?.name === "John Deere";
                  const isBest = model.weight_kg === bestValues.lowestWeight;
                  return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-medium",
                        model.id === selectedModel.id && "bg-primary/5"
                      )}
                    >
                      <CellValue 
                        value={model.weight_kg} 
                        isBest={isBest && !!model.weight_kg}
                        isJohnDeere={isJohnDeere}
                      />
                    </td>
                  );
                })}
              </tr>

              {/* Fuel Consumption */}
              <tr className="border-b border-border/50">
                <td className="sticky left-0 z-10 bg-card p-3 text-sm text-muted-foreground border-r border-border">Kütusekulu (l/h)</td>
                {allModels.map((model) => {
                  const isJohnDeere = model.brand?.name === "John Deere";
                  const isBest = model.fuel_consumption_lh === bestValues.lowestFuel;
                  return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-medium",
                        model.id === selectedModel.id && "bg-primary/5"
                      )}
                    >
                      <CellValue 
                        value={model.fuel_consumption_lh} 
                        isBest={isBest && !!model.fuel_consumption_lh}
                        isJohnDeere={isJohnDeere}
                      />
                    </td>
                  );
                })}
              </tr>

              {/* Price Section Header */}
              <tr className="bg-muted/50">
                <td colSpan={allModels.length + 1} className="p-3 text-sm font-semibold text-foreground border-y border-border">
                  HINNAD JA KULUD
                </td>
              </tr>

              {/* Price */}
              <tr className="border-b border-border/50">
                <td className="sticky left-0 z-10 bg-card p-3 text-sm text-muted-foreground border-r border-border">Hind</td>
                {allModels.map((model) => {
                  const isJohnDeere = model.brand?.name === "John Deere";
                  const isBest = model.price_eur === bestValues.lowestPrice;
                  return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-medium",
                        model.id === selectedModel.id && "bg-primary/5"
                      )}
                    >
                      <CellValue 
                        value={model.price_eur} 
                        format="currency"
                        isBest={isBest && !!model.price_eur}
                        isJohnDeere={isJohnDeere}
                      />
                    </td>
                  );
                })}
              </tr>

              {/* Annual Maintenance */}
              <tr className="border-b border-border/50">
                <td className="sticky left-0 z-10 bg-card p-3 text-sm text-muted-foreground border-r border-border">Hooldus/aastas</td>
                {allModels.map((model) => {
                  const isJohnDeere = model.brand?.name === "John Deere";
                  const isBest = model.annual_maintenance_eur === bestValues.lowestMaintenance;
                  return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-medium",
                        model.id === selectedModel.id && "bg-primary/5"
                      )}
                    >
                      <CellValue 
                        value={model.annual_maintenance_eur} 
                        format="currency"
                        isBest={isBest && !!model.annual_maintenance_eur}
                        isJohnDeere={isJohnDeere}
                      />
                    </td>
                  );
                })}
              </tr>

              {/* Expected Lifespan */}
              <tr className="border-b border-border/50">
                <td className="sticky left-0 z-10 bg-card p-3 text-sm text-muted-foreground border-r border-border">Eeldatav eluiga</td>
                {allModels.map((model) => {
                  const isJohnDeere = model.brand?.name === "John Deere";
                  const lifespan = model.expected_lifespan_years || 10;
                  const isBest = lifespan === bestValues.highestLifespan;
                  return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-medium",
                        model.id === selectedModel.id && "bg-primary/5"
                      )}
                    >
                      <CellValue 
                        value={lifespan} 
                        isBest={isBest}
                        isJohnDeere={isJohnDeere}
                        suffix=" aastat"
                      />
                    </td>
                  );
                })}
              </tr>

              {/* TCO */}
              <tr className="border-b border-border bg-muted/30">
                <td className="sticky left-0 z-10 bg-muted/30 p-3 text-sm font-semibold text-foreground border-r border-border">TCO (Kogukulu)</td>
                {allModels.map((model) => {
                  const isJohnDeere = model.brand?.name === "John Deere";
                  const tco = calculateTCO(model);
                  const isBest = tco === bestValues.lowestTCO;
                  return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-semibold",
                        model.id === selectedModel.id && "bg-primary/5"
                      )}
                    >
                      <CellValue 
                        value={tco} 
                        format="currency"
                        isBest={isBest && tco !== null}
                        isJohnDeere={isJohnDeere}
                      />
                    </td>
                  );
                })}
              </tr>

              {/* Savings compared to selected */}
              <tr className="bg-primary/5">
                <td className="sticky left-0 z-10 bg-primary/5 p-3 text-sm font-medium text-foreground border-r border-border">Sääst vs valitud</td>
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
                  const isPositive = diff < 0; // Negative diff means selected is cheaper
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
