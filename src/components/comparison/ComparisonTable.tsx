import { Equipment } from "@/types/equipment";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonTableProps {
  equipment: Equipment[];
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

function getBrandColorClass(brandName: string): string {
  switch (brandName) {
    case "John Deere":
      return "bg-primary";
    case "Claas":
      return "bg-claas";
    case "Case IH":
      return "bg-case-ih";
    case "New Holland":
      return "bg-new-holland";
    default:
      return "bg-muted";
  }
}

export function ComparisonTable({ equipment }: ComparisonTableProps) {
  if (equipment.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">
          Valitud filtritele vastavaid tehnikaid ei leitud.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Lisage tehnikaid administraatori vaates.
        </p>
      </div>
    );
  }

  // Find best values for highlighting
  const bestPower = Math.max(...equipment.map((e) => e.engine_power_hp || 0));
  const bestTank = Math.max(...equipment.map((e) => e.grain_tank_liters || 0));
  const lowestFuel = Math.min(
    ...equipment.filter((e) => e.fuel_consumption_lh).map((e) => e.fuel_consumption_lh!)
  );
  const lowestTCO = Math.min(
    ...equipment.filter((e) => calculateTCO(e)).map((e) => calculateTCO(e)!)
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="data-table">
        <thead>
          <tr>
            <th className="min-w-[180px]">Mudel</th>
            <th>Bränd</th>
            <th>Jõuklass</th>
            <th className="text-right">Võimsus (hj)</th>
            <th className="text-right">Viljabunker (l)</th>
            <th className="text-right">Heedri laius (m)</th>
            <th className="text-right">Kaal (kg)</th>
            <th className="text-right">Kütusekulu (l/h)</th>
            <th className="text-right">Hind (€)</th>
            <th className="text-right">Hooldus/a (€)</th>
            <th className="text-right">TCO (€)</th>
          </tr>
        </thead>
        <tbody>
          {equipment.map((item) => {
            const tco = calculateTCO(item);
            const isJohnDeere = item.brand?.name === "John Deere";
            
            return (
              <tr
                key={item.id}
                className={cn(
                  isJohnDeere && "bg-primary/5"
                )}
              >
                <td className="font-medium">
                  <div className="flex items-center gap-2">
                    {isJohnDeere && (
                      <Trophy className="h-4 w-4 text-primary" />
                    )}
                    {item.model_name}
                  </div>
                </td>
                <td>
                  <Badge
                    className={cn(
                      "text-xs font-medium text-white",
                      getBrandColorClass(item.brand?.name || "")
                    )}
                  >
                    {item.brand?.name}
                  </Badge>
                </td>
                <td className="text-sm text-muted-foreground">
                  {item.power_class?.name || "—"}
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {formatNumber(item.engine_power_hp)}
                    {item.engine_power_hp === bestPower && (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    )}
                  </div>
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {formatNumber(item.grain_tank_liters)}
                    {item.grain_tank_liters === bestTank && (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    )}
                  </div>
                </td>
                <td className="text-right">
                  {item.header_width_m ? `${item.header_width_m}` : "—"}
                </td>
                <td className="text-right">{formatNumber(item.weight_kg)}</td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {item.fuel_consumption_lh || "—"}
                    {item.fuel_consumption_lh === lowestFuel && (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    )}
                  </div>
                </td>
                <td className="text-right">{formatCurrency(item.price_eur)}</td>
                <td className="text-right">
                  {formatCurrency(item.annual_maintenance_eur)}
                </td>
                <td className="text-right font-semibold">
                  <div className="flex items-center justify-end gap-1">
                    {formatCurrency(tco)}
                    {tco === lowestTCO && (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
