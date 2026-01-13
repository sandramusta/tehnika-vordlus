import { Equipment } from "@/types/equipment";
import { TrendingDown, Calendar, Wrench, DollarSign, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TCOSummaryProps {
  selectedModel: Equipment;
  competitors: Equipment[];
}

function calculateTCO(equipment: Equipment): number | null {
  if (!equipment.price_eur || !equipment.annual_maintenance_eur) return null;
  const lifespan = equipment.expected_lifespan_years || 10;
  return equipment.price_eur + equipment.annual_maintenance_eur * lifespan;
}

function formatCurrency(num: number | null): string {
  if (num === null) return "—";
  return new Intl.NumberFormat("et-EE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(num);
}

function getBrandColorClass(brandName: string): string {
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

export function TCOSummary({ selectedModel, competitors }: TCOSummaryProps) {
  const allModels = [selectedModel, ...competitors];
  
  // Calculate TCO for all models
  const modelsWithTCO = allModels
    .map(model => ({
      model,
      tco: calculateTCO(model),
      maintenance: model.annual_maintenance_eur,
      lifespan: model.expected_lifespan_years || 10,
    }))
    .filter(item => item.tco !== null);

  if (modelsWithTCO.length < 2) {
    return null;
  }

  // Find best values
  const lowestTCO = Math.min(...modelsWithTCO.map(m => m.tco!));
  const lowestMaintenance = Math.min(...modelsWithTCO.filter(m => m.maintenance).map(m => m.maintenance!));
  const highestLifespan = Math.max(...modelsWithTCO.map(m => m.lifespan));

  const selectedTCO = calculateTCO(selectedModel);
  
  // Calculate savings compared to competitors
  const avgCompetitorTCO = modelsWithTCO
    .filter(m => m.model.id !== selectedModel.id)
    .reduce((sum, m) => sum + m.tco!, 0) / (modelsWithTCO.length - 1);

  const tcoSavings = selectedTCO ? avgCompetitorTCO - selectedTCO : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
        <TrendingDown className="h-5 w-5 text-primary" />
        Omamiskogukulu võrdlus
      </h3>

      {/* TCO Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="p-3 text-left text-sm font-medium text-muted-foreground">Näitaja</th>
              {allModels.map((model) => (
                <th 
                  key={model.id} 
                  className={cn(
                    "p-3 text-center text-sm font-semibold min-w-[140px]",
                    model.id === selectedModel.id && "bg-primary/5"
                  )}
                >
                  <span className={getBrandColorClass(model.brand?.name || "")}>
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
            {/* Price */}
            <tr className="border-b border-border/50">
              <td className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Ostuhind
              </td>
              {allModels.map((model) => (
                <td 
                  key={model.id} 
                  className={cn(
                    "p-3 text-center text-sm font-medium",
                    model.id === selectedModel.id && "bg-primary/5"
                  )}
                >
                  {formatCurrency(model.price_eur)}
                </td>
              ))}
            </tr>

            {/* Annual Maintenance */}
            <tr className="border-b border-border/50">
              <td className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Hooldus/aasta
              </td>
              {allModels.map((model) => {
                const isBest = model.annual_maintenance_eur === lowestMaintenance;
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
              <td className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Eeldatav eluiga
              </td>
              {allModels.map((model) => {
                const lifespan = model.expected_lifespan_years || 10;
                const isBest = lifespan === highestLifespan;
                return (
                  <td 
                    key={model.id} 
                    className={cn(
                      "p-3 text-center text-sm font-medium",
                      model.id === selectedModel.id && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {lifespan} aastat
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
              <td className="p-3 text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Omamiskogukulu
              </td>
              {allModels.map((model) => {
                const tco = calculateTCO(model);
                const isBest = tco === lowestTCO;
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
                      {isBest && (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Savings compared to selected */}
            <tr>
              <td className="p-3 text-sm text-muted-foreground">
                Sääst/lisakulu vs valitud
              </td>
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
          </tbody>
        </table>
      </div>

      {/* Summary message */}
      {tcoSavings !== 0 && selectedTCO && (
        <div className={cn(
          "mt-4 rounded-lg p-4 text-center",
          tcoSavings > 0 ? "bg-success/10" : "bg-destructive/10"
        )}>
          <span className={cn(
            "text-lg font-semibold",
            tcoSavings > 0 ? "text-success" : "text-destructive"
          )}>
            {tcoSavings > 0 
              ? `${selectedModel.brand?.name} säästab keskmiselt ${formatCurrency(tcoSavings)} võrreldes konkurentidega!`
              : `Konkurendid säästaksid keskmiselt ${formatCurrency(Math.abs(tcoSavings))} võrreldes ${selectedModel.brand?.name} mudeliga.`
            }
          </span>
        </div>
      )}
    </div>
  );
}
