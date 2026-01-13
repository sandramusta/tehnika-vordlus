import { Equipment } from "@/types/equipment";
import { TrendingDown, Calendar, Wrench, DollarSign } from "lucide-react";

interface TCOSummaryProps {
  equipment: Equipment[];
}

function calculateTCO(equipment: Equipment): number | null {
  if (!equipment.price_eur || !equipment.annual_maintenance_eur) return null;
  const lifespan = equipment.expected_lifespan_years || 10;
  return equipment.price_eur + equipment.annual_maintenance_eur * lifespan;
}

function formatCurrency(num: number): string {
  return new Intl.NumberFormat("et-EE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function TCOSummary({ equipment }: TCOSummaryProps) {
  const johnDeereEquipment = equipment.filter(
    (e) => e.brand?.name === "John Deere"
  );
  const competitorEquipment = equipment.filter(
    (e) => e.brand?.name !== "John Deere"
  );

  const jdWithTCO = johnDeereEquipment.filter((e) => calculateTCO(e) !== null);
  const compWithTCO = competitorEquipment.filter(
    (e) => calculateTCO(e) !== null
  );

  if (jdWithTCO.length === 0 || compWithTCO.length === 0) {
    return null;
  }

  const avgJDTCO =
    jdWithTCO.reduce((sum, e) => sum + calculateTCO(e)!, 0) / jdWithTCO.length;
  const avgCompTCO =
    compWithTCO.reduce((sum, e) => sum + calculateTCO(e)!, 0) /
    compWithTCO.length;

  const avgJDMaintenance =
    jdWithTCO.reduce((sum, e) => sum + (e.annual_maintenance_eur || 0), 0) /
    jdWithTCO.length;
  const avgCompMaintenance =
    compWithTCO.reduce((sum, e) => sum + (e.annual_maintenance_eur || 0), 0) /
    compWithTCO.length;

  const avgJDLifespan =
    jdWithTCO.reduce((sum, e) => sum + e.expected_lifespan_years, 0) /
    jdWithTCO.length;
  const avgCompLifespan =
    compWithTCO.reduce((sum, e) => sum + e.expected_lifespan_years, 0) /
    compWithTCO.length;

  const tcoSavings = avgCompTCO - avgJDTCO;
  const maintenanceSavings = avgCompMaintenance - avgJDMaintenance;

  return (
    <div className="rounded-xl border border-success/30 bg-success/5 p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
        <TrendingDown className="h-5 w-5 text-success" />
        TCO kokkuvõte: John Deere vs konkurendid
      </h3>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="stat-card">
          <DollarSign className="mx-auto mb-2 h-8 w-8 text-primary" />
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(avgJDTCO)}
          </div>
          <div className="text-sm text-muted-foreground">
            John Deere keskm. TCO
          </div>
        </div>

        <div className="stat-card">
          <DollarSign className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(avgCompTCO)}
          </div>
          <div className="text-sm text-muted-foreground">
            Konkurentide keskm. TCO
          </div>
        </div>

        <div className="stat-card">
          <Wrench className="mx-auto mb-2 h-8 w-8 text-primary" />
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(avgJDMaintenance)}
          </div>
          <div className="text-sm text-muted-foreground">
            John Deere hooldus/aasta
          </div>
          {maintenanceSavings > 0 && (
            <div className="mt-1 text-xs font-medium text-success">
              Sääst: {formatCurrency(maintenanceSavings)}/a
            </div>
          )}
        </div>

        <div className="stat-card">
          <Calendar className="mx-auto mb-2 h-8 w-8 text-primary" />
          <div className="text-2xl font-bold text-foreground">
            {avgJDLifespan.toFixed(0)} vs {avgCompLifespan.toFixed(0)} a
          </div>
          <div className="text-sm text-muted-foreground">Eeldatav eluiga</div>
        </div>
      </div>

      {tcoSavings > 0 && (
        <div className="mt-4 rounded-lg bg-success/10 p-4 text-center">
          <span className="text-lg font-semibold text-success">
            John Deere säästab keskmiselt {formatCurrency(tcoSavings)} kogu
            eluea jooksul!
          </span>
        </div>
      )}
    </div>
  );
}
