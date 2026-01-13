import { Equipment, CompetitiveArgument, Brand } from "@/types/equipment";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, CheckCircle2, Shield, Zap, Wrench, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

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

function getCategoryIcon(category: string) {
  switch (category) {
    case "technology":
      return Zap;
    case "reliability":
      return Shield;
    case "service":
      return Wrench;
    case "efficiency":
      return Leaf;
    case "value":
      return TrendingUp;
    default:
      return Shield;
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case "technology":
      return "Tehnoloogia";
    case "reliability":
      return "Töökindlus";
    case "service":
      return "Teenindus";
    case "efficiency":
      return "Efektiivsus";
    case "value":
      return "Väärtus";
    default:
      return "Üldine";
  }
}

export function ModelComparison({
  selectedModel,
  competitors,
  competitiveArgs,
  brands,
}: ModelComparisonProps) {
  if (!selectedModel) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-lg font-medium text-muted-foreground">
          Vali John Deere mudel võrdluseks
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Vali tehnika tüüp ja John Deere mudel, et näha võrdlust konkurentidega samas jõuklassis.
        </p>
      </div>
    );
  }

  const selectedTCO = calculateTCO(selectedModel);

  return (
    <div className="space-y-8">
      {/* Selected John Deere Model Card */}
      <Card className="border-2 border-primary bg-primary/5">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">Valitud mudel</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {/* Model Image */}
            {selectedModel.image_url && (
              <div className="md:col-span-2 lg:col-span-1">
                <img 
                  src={selectedModel.image_url} 
                  alt={selectedModel.model_name}
                  className="h-32 w-full rounded-lg object-contain bg-white"
                />
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Mudel</p>
              <p className="text-lg font-bold text-foreground">{selectedModel.model_name}</p>
              <Badge className="mt-1 bg-primary text-primary-foreground">
                {selectedModel.brand?.name}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Jõuklass</p>
              <p className="font-semibold">{selectedModel.power_class?.name || "—"}</p>
              <p className="text-sm text-muted-foreground">
                {formatNumber(selectedModel.engine_power_hp)} hj
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hind</p>
              <p className="font-semibold">{formatCurrency(selectedModel.price_eur)}</p>
              <p className="text-sm text-muted-foreground">
                Hooldus: {formatCurrency(selectedModel.annual_maintenance_eur)}/a
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">TCO ({selectedModel.expected_lifespan_years}a)</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(selectedTCO)}</p>
            </div>
          </div>
          {/* Threshing System Image */}
          {selectedModel.threshing_system_image_url && (
            <div className="mt-4 border-t pt-4">
              <p className="mb-2 text-sm font-medium text-muted-foreground">Peksu- ja puhastussüsteem</p>
              <img 
                src={selectedModel.threshing_system_image_url} 
                alt="Peksusüsteem"
                className="h-40 w-full rounded-lg object-contain bg-muted/20"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Competitors Comparison */}
      {competitors.length > 0 ? (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-foreground">
            Konkurendid samas jõuklassis ({selectedModel.power_class?.name})
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {competitors.map((competitor) => {
              const competitorTCO = calculateTCO(competitor);
              const tcoSavings = selectedTCO && competitorTCO ? competitorTCO - selectedTCO : null;
              const competitorArgs = competitiveArgs.filter(
                (arg) => arg.competitor_brand_id === competitor.brand_id
              );

              return (
                <Card key={competitor.id} className="relative overflow-hidden">
                  {/* Brand color accent */}
                  <div
                    className={cn(
                      "absolute left-0 top-0 h-full w-1",
                      getBrandColorClass(competitor.brand?.name || "")
                    )}
                  />
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{competitor.model_name}</CardTitle>
                      <Badge
                        className={cn(
                          "text-xs text-white",
                          getBrandColorClass(competitor.brand?.name || "")
                        )}
                      >
                        {competitor.brand?.name}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Competitor Image */}
                    {competitor.image_url && (
                      <img 
                        src={competitor.image_url} 
                        alt={competitor.model_name}
                        className="h-24 w-full rounded-md object-contain bg-white"
                      />
                    )}
                    {/* Technical Specs Comparison */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Võimsus</span>
                        <span className="font-medium">
                          {formatNumber(competitor.engine_power_hp)} hj
                          {selectedModel.engine_power_hp && competitor.engine_power_hp && (
                            <span className={cn(
                              "ml-1 text-xs",
                              selectedModel.engine_power_hp >= competitor.engine_power_hp 
                                ? "text-success" 
                                : "text-destructive"
                            )}>
                              {selectedModel.engine_power_hp >= competitor.engine_power_hp ? "✓" : ""}
                            </span>
                          )}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Viljabunker</span>
                        <span className="font-medium">
                          {formatNumber(competitor.grain_tank_liters)} l
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Kütusekulu</span>
                        <span className="font-medium">
                          {competitor.fuel_consumption_lh || "—"} l/h
                          {selectedModel.fuel_consumption_lh && competitor.fuel_consumption_lh && (
                            <span className={cn(
                              "ml-1 text-xs",
                              selectedModel.fuel_consumption_lh <= competitor.fuel_consumption_lh 
                                ? "text-success" 
                                : "text-destructive"
                            )}>
                              {selectedModel.fuel_consumption_lh <= competitor.fuel_consumption_lh ? "✓" : ""}
                            </span>
                          )}
                        </span>
                      </div>
                      
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-muted-foreground">Hind</span>
                        <span className="font-semibold">{formatCurrency(competitor.price_eur)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">TCO</span>
                        <span className="font-semibold">{formatCurrency(competitorTCO)}</span>
                      </div>
                      
                      {tcoSavings && tcoSavings > 0 && (
                        <div className="flex items-center justify-between rounded-md bg-success/10 px-2 py-1">
                          <span className="text-xs font-medium text-success">
                            John Deere sääst
                          </span>
                          <span className="text-sm font-bold text-success">
                            {formatCurrency(tcoSavings)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Competitive Advantages */}
                    {competitorArgs.length > 0 && (
                      <div className="space-y-2 border-t pt-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          John Deere eelised
                        </p>
                        <div className="space-y-2">
                          {competitorArgs.slice(0, 3).map((arg) => {
                            const Icon = getCategoryIcon(arg.category);
                            return (
                              <div
                                key={arg.id}
                                className="flex items-start gap-2 text-xs"
                              >
                                <Icon className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                                <div>
                                  <p className="font-medium text-foreground">
                                    {arg.argument_title}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          {competitorArgs.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{competitorArgs.length - 3} veel...
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            Samas jõuklassis konkurente ei leitud.
          </p>
        </div>
      )}
    </div>
  );
}
