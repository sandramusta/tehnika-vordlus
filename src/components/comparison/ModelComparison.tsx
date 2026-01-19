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

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="p-3 text-left text-sm font-medium text-muted-foreground min-w-[150px]">Näitaja</th>
              {allModels.map((model) => (
                <th 
                  key={model.id} 
                  className={cn(
                    "p-3 text-center text-sm font-semibold min-w-[160px]",
                    model.id === selectedModel.id && "bg-primary/5"
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
          </thead>
          <tbody>
            {/* Model Image */}
            <tr className="border-b border-border/50">
              <td className="p-3"></td>
              {allModels.map((model) => (
                <td 
                  key={model.id} 
                  className={cn(
                    "p-3 text-center",
                    model.id === selectedModel.id && "bg-primary/5"
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
                </td>
              ))}
            </tr>
            {/* Engine Power */}
            <tr className="border-b border-border/50">
              <td className="p-3 text-sm text-muted-foreground">Võimsus (hj)</td>
              {allModels.map((model) => {
                const isBest = model.engine_power_hp === bestValues.power;
                return (
                  <td 
                    key={model.id} 
                    className={cn(
                      "p-3 text-center text-sm font-medium",
                      model.id === selectedModel.id && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {formatNumber(model.engine_power_hp)}
                      {isBest && model.engine_power_hp && (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Grain Tank */}
            <tr className="border-b border-border/50">
              <td className="p-3 text-sm text-muted-foreground">Viljabunker (l)</td>
              {allModels.map((model) => {
                const isBest = model.grain_tank_liters === bestValues.tank;
                return (
                  <td 
                    key={model.id} 
                    className={cn(
                      "p-3 text-center text-sm font-medium",
                      model.id === selectedModel.id && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {formatNumber(model.grain_tank_liters)}
                      {isBest && model.grain_tank_liters && (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Header Width */}
            <tr className="border-b border-border/50">
              <td className="p-3 text-sm text-muted-foreground">Heedri laius (m)</td>
              {allModels.map((model) => {
                const isBest = model.header_width_m === bestValues.headerWidth;
                return (
                  <td 
                    key={model.id} 
                    className={cn(
                      "p-3 text-center text-sm font-medium",
                      model.id === selectedModel.id && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {model.header_width_m || "—"}
                      {isBest && model.header_width_m && (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Fuel Tank */}
            {allModels.some(m => m.fuel_tank_liters) && (
              <tr className="border-b border-border/50">
                <td className="p-3 text-sm text-muted-foreground">Kütusepaak (L)</td>
                {allModels.map((model) => {
                  const isBest = model.fuel_tank_liters === bestValues.fuelTank;
                  return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-medium",
                        model.id === selectedModel.id && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {model.fuel_tank_liters ? formatNumber(model.fuel_tank_liters) : "—"}
                        {isBest && model.fuel_tank_liters && (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Cleaning Area */}
            {allModels.some(m => m.cleaning_area_m2) && (
              <tr className="border-b border-border/50">
                <td className="p-3 text-sm text-muted-foreground">Puhasti pindala (m²)</td>
                {allModels.map((model) => {
                  const isBest = model.cleaning_area_m2 === bestValues.cleaningArea;
                  return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-medium",
                        model.id === selectedModel.id && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {model.cleaning_area_m2 || "—"}
                        {isBest && model.cleaning_area_m2 && (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Rotor Diameter */}
            {allModels.some(m => m.rotor_diameter_mm) && (
              <tr className="border-b border-border/50">
                <td className="p-3 text-sm text-muted-foreground">Rootori läbimõõt (mm)</td>
                {allModels.map((model) => {
                  const isBest = model.rotor_diameter_mm === bestValues.rotorDiameter;
                  return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-medium",
                        model.id === selectedModel.id && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {model.rotor_diameter_mm ? formatNumber(model.rotor_diameter_mm) : "—"}
                        {isBest && model.rotor_diameter_mm && (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Throughput */}
            {allModels.some(m => m.throughput_tons_h) && (
              <tr className="border-b border-border/50">
                <td className="p-3 text-sm text-muted-foreground">Läbilaskevõime (t/h)</td>
                {allModels.map((model) => {
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
                        {model.throughput_tons_h ? `>${model.throughput_tons_h}` : "—"}
                        {isBest && model.throughput_tons_h && (
                          <CheckCircle2 className="h-4 w-4 text-success" />
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
                <td className="p-3 text-sm text-muted-foreground">Silindrid</td>
                {allModels.map((model) => {
                  const isBest = model.engine_cylinders === bestValues.engineCylinders;
                  return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-medium",
                        model.id === selectedModel.id && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {model.engine_cylinders || "—"}
                        {isBest && model.engine_cylinders && (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Max Torque */}
            {allModels.some(m => m.max_torque_nm) && (
              <tr className="border-b border-border/50">
                <td className="p-3 text-sm text-muted-foreground">Max pöördemoment (Nm)</td>
                {allModels.map((model) => {
                  const isBest = model.max_torque_nm === bestValues.maxTorque;
                  return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-medium",
                        model.id === selectedModel.id && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {model.max_torque_nm ? formatNumber(model.max_torque_nm) : "—"}
                        {isBest && model.max_torque_nm && (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Feeder Width */}
            {allModels.some(m => m.feeder_width_mm) && (
              <tr className="border-b border-border/50">
                <td className="p-3 text-sm text-muted-foreground">Etteande laius (mm)</td>
                {allModels.map((model) => {
                  const isBest = model.feeder_width_mm === bestValues.feederWidth;
                  return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-medium",
                        model.id === selectedModel.id && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {model.feeder_width_mm ? formatNumber(model.feeder_width_mm) : "—"}
                        {isBest && model.feeder_width_mm && (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Threshing Area (for conventional) */}
            {allModels.some(m => m.threshing_area_m2) && (
              <tr className="border-b border-border/50">
                <td className="p-3 text-sm text-muted-foreground">Peksupind (m²)</td>
                {allModels.map((model) => {
                  const isBest = model.threshing_area_m2 === bestValues.threshingArea;
                  return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-medium",
                        model.id === selectedModel.id && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {model.threshing_area_m2 || "—"}
                        {isBest && model.threshing_area_m2 && (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Rotor Length */}
            {allModels.some(m => m.rotor_length_mm) && (
              <tr className="border-b border-border/50">
                <td className="p-3 text-sm text-muted-foreground">Rootori pikkus (mm)</td>
                {allModels.map((model) => {
                  const isBest = model.rotor_length_mm === bestValues.rotorLength;
                  return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-medium",
                        model.id === selectedModel.id && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {model.rotor_length_mm ? formatNumber(model.rotor_length_mm) : "—"}
                        {isBest && model.rotor_length_mm && (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Separator Area */}
            {allModels.some(m => m.separator_area_m2) && (
              <tr className="border-b border-border/50">
                <td className="p-3 text-sm text-muted-foreground">Separaatori pindala (m²)</td>
                {allModels.map((model) => {
                  const isBest = model.separator_area_m2 === bestValues.separatorArea;
                  return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-medium",
                        model.id === selectedModel.id && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {model.separator_area_m2 || "—"}
                        {isBest && model.separator_area_m2 && (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Straw Walker Area */}
            {allModels.some(m => m.straw_walker_area_m2) && (
              <tr className="border-b border-border/50">
                <td className="p-3 text-sm text-muted-foreground">Klahvpuisturite pindala (m²)</td>
                {allModels.map((model) => {
                  const isBest = model.straw_walker_area_m2 === bestValues.strawWalkerArea;
                  return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-medium",
                        model.id === selectedModel.id && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {model.straw_walker_area_m2 || "—"}
                        {isBest && model.straw_walker_area_m2 && (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Sieve Area */}
            {allModels.some(m => m.sieve_area_m2) && (
              <tr className="border-b border-border/50">
                <td className="p-3 text-sm text-muted-foreground">Sõelapind (m²)</td>
                {allModels.map((model) => {
                  const isBest = model.sieve_area_m2 === bestValues.sieveArea;
                  return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-medium",
                        model.id === selectedModel.id && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {model.sieve_area_m2 || "—"}
                        {isBest && model.sieve_area_m2 && (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Unloading Rate */}
            {allModels.some(m => m.unloading_rate_ls) && (
              <tr className="border-b border-border/50">
                <td className="p-3 text-sm text-muted-foreground">Mahalaadimiskiirus (l/s)</td>
                {allModels.map((model) => {
                  const isBest = model.unloading_rate_ls === bestValues.unloadingRate;
                  return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-medium",
                        model.id === selectedModel.id && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {model.unloading_rate_ls || "—"}
                        {isBest && model.unloading_rate_ls && (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Auger Reach */}
            {allModels.some(m => m.auger_reach_m) && (
              <tr className="border-b border-border/50">
                <td className="p-3 text-sm text-muted-foreground">Tigukõrgus (m)</td>
                {allModels.map((model) => {
                  const isBest = model.auger_reach_m === bestValues.augerReach;
                  return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-medium",
                        model.id === selectedModel.id && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {model.auger_reach_m || "—"}
                        {isBest && model.auger_reach_m && (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Max Slope */}
            {allModels.some(m => m.max_slope_percent) && (
              <tr className="border-b border-border/50">
                <td className="p-3 text-sm text-muted-foreground">Max nõlvakald (%)</td>
                {allModels.map((model) => {
                  const isBest = model.max_slope_percent === bestValues.maxSlope;
                  return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-medium",
                        model.id === selectedModel.id && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {model.max_slope_percent ? `${model.max_slope_percent}%` : "—"}
                        {isBest && model.max_slope_percent && (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Header Width Range */}
            {allModels.some(m => m.header_width_min_m || m.header_width_max_m) && (
              <tr className="border-b border-border/50">
                <td className="p-3 text-sm text-muted-foreground">Heedri laiusvahemik (m)</td>
                {allModels.map((model) => {
                  const isBest = model.header_width_max_m === bestValues.headerWidthMax;
                  return (
                    <td 
                      key={model.id} 
                      className={cn(
                        "p-3 text-center text-sm font-medium",
                        model.id === selectedModel.id && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {model.header_width_min_m && model.header_width_max_m 
                          ? `${model.header_width_min_m}–${model.header_width_max_m}` 
                          : "—"}
                        {isBest && model.header_width_max_m && (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Weight */}
            <tr className="border-b border-border/50">
              <td className="p-3 text-sm text-muted-foreground">Kaal (kg)</td>
              {allModels.map((model) => {
                const isBest = model.weight_kg === bestValues.lowestWeight;
                return (
                  <td 
                    key={model.id} 
                    className={cn(
                      "p-3 text-center text-sm font-medium",
                      model.id === selectedModel.id && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {formatNumber(model.weight_kg)}
                      {isBest && model.weight_kg && (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Fuel Consumption */}
            <tr className="border-b border-border/50">
              <td className="p-3 text-sm text-muted-foreground">Kütusekulu (l/h)</td>
              {allModels.map((model) => {
                const isBest = model.fuel_consumption_lh === bestValues.lowestFuel;
                return (
                  <td 
                    key={model.id} 
                    className={cn(
                      "p-3 text-center text-sm font-medium",
                      model.id === selectedModel.id && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {model.fuel_consumption_lh || "—"}
                      {isBest && model.fuel_consumption_lh && (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Price */}
            <tr className="border-b border-border/50 bg-muted/20">
              <td className="p-3 text-sm font-medium text-foreground">Hind (€)</td>
              {allModels.map((model) => {
                const isBest = model.price_eur === bestValues.lowestPrice;
                return (
                  <td 
                    key={model.id} 
                    className={cn(
                      "p-3 text-center text-sm font-semibold",
                      model.id === selectedModel.id && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {formatCurrency(model.price_eur)}
                      {isBest && model.price_eur && (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Annual Maintenance */}
            <tr className="border-b border-border/50">
              <td className="p-3 text-sm text-muted-foreground">Hooldus/aasta (€)</td>
              {allModels.map((model) => {
                const isBest = model.annual_maintenance_eur === bestValues.lowestMaintenance;
                return (
                  <td 
                    key={model.id} 
                    className={cn(
                      "p-3 text-center text-sm font-medium",
                      model.id === selectedModel.id && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {formatCurrency(model.annual_maintenance_eur)}
                      {isBest && model.annual_maintenance_eur && (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Lifespan */}
            <tr className="border-b border-border/50">
              <td className="p-3 text-sm text-muted-foreground">Eeldatav eluiga (a)</td>
              {allModels.map((model) => {
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
                    <div className="flex items-center justify-center gap-1">
                      {lifespan}
                      {isBest && (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* TCO */}
            <tr className="border-b border-border bg-muted/30">
              <td className="p-3 text-sm font-semibold text-foreground">Omamiskogukulu (€)</td>
              {allModels.map((model) => {
                const tco = calculateTCO(model);
                const isBest = tco === bestValues.lowestTCO;
                return (
                  <td 
                    key={model.id} 
                    className={cn(
                      "p-3 text-center font-bold",
                      model.id === selectedModel.id && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className={isBest ? "text-success" : ""}>
                        {formatCurrency(tco)}
                      </span>
                      {isBest && tco && (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Savings compared to selected */}
            <tr>
              <td className="p-3 text-sm text-muted-foreground">Sääst/lisakulu vs valitud</td>
              {allModels.map((model) => {
                const tco = calculateTCO(model);
                const savings = selectedTCO && tco ? tco - selectedTCO : null;
                return (
                  <td 
                    key={model.id} 
                    className={cn(
                      "p-3 text-center text-sm font-medium",
                      model.id === selectedModel.id && "bg-primary/5"
                    )}
                  >
                    {model.id === selectedModel.id ? (
                      <span className="text-muted-foreground">—</span>
                    ) : savings !== null ? (
                      <span className={savings > 0 ? "text-success" : savings < 0 ? "text-destructive" : ""}>
                        {savings > 0 ? "+" : ""}{formatCurrency(Math.abs(savings))}
                        {savings > 0 ? " kallim" : savings < 0 ? " odavam" : ""}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Threshing System Images */}
            {allModels.some(m => m.threshing_system_image_url) && (
              <tr className="border-t border-border">
                <td className="p-3 text-sm text-muted-foreground">Peksusüsteem</td>
                {allModels.map((model) => (
                  <td 
                    key={model.id} 
                    className={cn(
                      "p-3 text-center",
                      model.id === selectedModel.id && "bg-primary/5"
                    )}
                  >
                    {model.threshing_system_image_url ? (
                      <img 
                        src={model.threshing_system_image_url} 
                        alt="Peksusüsteem"
                        className="h-24 w-full rounded-md object-contain bg-muted/20 mx-auto"
                      />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                ))}
              </tr>
            )}

            {/* Detailed Specs Rows */}
            <DetailedSpecsTableRows 
              allModels={allModels} 
              selectedModelId={selectedModel.id} 
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}
