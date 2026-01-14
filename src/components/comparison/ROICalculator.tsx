import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, TrendingUp, Clock, Fuel, Wrench } from "lucide-react";

interface ROIInputs {
  purchasePrice: number;
  annualWorkHours: number;
  fuelConsumption: number;
  fuelPrice: number;
  annualMaintenance: number;
  operatorHourlyCost: number;
  expectedLifespan: number;
  annualHectares: number;
  revenuePerHectare: number;
}

const defaultInputs: ROIInputs = {
  purchasePrice: 450000,
  annualWorkHours: 400,
  fuelConsumption: 45,
  fuelPrice: 1.5,
  annualMaintenance: 15000,
  operatorHourlyCost: 25,
  expectedLifespan: 10,
  annualHectares: 800,
  revenuePerHectare: 150,
};

export function ROICalculator() {
  const [inputs, setInputs] = useState<ROIInputs>(defaultInputs);

  const updateInput = (key: keyof ROIInputs, value: string) => {
    const numValue = parseFloat(value) || 0;
    setInputs((prev) => ({ ...prev, [key]: numValue }));
  };

  const calculations = useMemo(() => {
    const annualFuelCost = inputs.annualWorkHours * inputs.fuelConsumption * inputs.fuelPrice;
    const annualOperatorCost = inputs.annualWorkHours * inputs.operatorHourlyCost;
    const annualDepreciation = inputs.purchasePrice / inputs.expectedLifespan;
    
    const totalAnnualCosts = annualFuelCost + annualOperatorCost + inputs.annualMaintenance + annualDepreciation;
    const totalLifetimeCosts = totalAnnualCosts * inputs.expectedLifespan;
    
    const annualRevenue = inputs.annualHectares * inputs.revenuePerHectare;
    const annualProfit = annualRevenue - totalAnnualCosts;
    
    const costPerHectare = inputs.annualHectares > 0 ? totalAnnualCosts / inputs.annualHectares : 0;
    const costPerHour = inputs.annualWorkHours > 0 ? totalAnnualCosts / inputs.annualWorkHours : 0;
    
    const paybackYears = annualProfit > 0 ? inputs.purchasePrice / annualProfit : Infinity;
    const roi = inputs.purchasePrice > 0 ? ((annualProfit * inputs.expectedLifespan) / inputs.purchasePrice) * 100 : 0;

    return {
      annualFuelCost,
      annualOperatorCost,
      annualDepreciation,
      totalAnnualCosts,
      totalLifetimeCosts,
      annualRevenue,
      annualProfit,
      costPerHectare,
      costPerHour,
      paybackYears,
      roi,
    };
  }, [inputs]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("et-EE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);

  const formatNumber = (value: number, decimals: number = 1) =>
    new Intl.NumberFormat("et-EE", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          ROI kalkulaator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Fields */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Purchase & Depreciation */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Soetamine
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="purchasePrice" className="text-sm">
                  Ostuhind (€)
                </Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  value={inputs.purchasePrice}
                  onChange={(e) => updateInput("purchasePrice", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expectedLifespan" className="text-sm">
                  Eeldatav kasutusaeg (aastat)
                </Label>
                <Input
                  id="expectedLifespan"
                  type="number"
                  value={inputs.expectedLifespan}
                  onChange={(e) => updateInput("expectedLifespan", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Operating Costs */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Tegevuskulud
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="annualWorkHours" className="text-sm">
                  Töötunnid aastas
                </Label>
                <Input
                  id="annualWorkHours"
                  type="number"
                  value={inputs.annualWorkHours}
                  onChange={(e) => updateInput("annualWorkHours", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fuelConsumption" className="text-sm">
                  Kütusekulu (l/h)
                </Label>
                <Input
                  id="fuelConsumption"
                  type="number"
                  step="0.1"
                  value={inputs.fuelConsumption}
                  onChange={(e) => updateInput("fuelConsumption", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fuelPrice" className="text-sm">
                  Kütuse hind (€/l)
                </Label>
                <Input
                  id="fuelPrice"
                  type="number"
                  step="0.01"
                  value={inputs.fuelPrice}
                  onChange={(e) => updateInput("fuelPrice", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Maintenance & Labor */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Hooldus & Tööjõud
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="annualMaintenance" className="text-sm">
                  Hoolduskulu aastas (€)
                </Label>
                <Input
                  id="annualMaintenance"
                  type="number"
                  value={inputs.annualMaintenance}
                  onChange={(e) => updateInput("annualMaintenance", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="operatorHourlyCost" className="text-sm">
                  Operaatori tunnihind (€/h)
                </Label>
                <Input
                  id="operatorHourlyCost"
                  type="number"
                  value={inputs.operatorHourlyCost}
                  onChange={(e) => updateInput("operatorHourlyCost", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div className="space-y-4 md:col-span-2 lg:col-span-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Tulu
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="annualHectares" className="text-sm">
                  Hektarid aastas
                </Label>
                <Input
                  id="annualHectares"
                  type="number"
                  value={inputs.annualHectares}
                  onChange={(e) => updateInput("annualHectares", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="revenuePerHectare" className="text-sm">
                  Tulu hektari kohta (€/ha)
                </Label>
                <Input
                  id="revenuePerHectare"
                  type="number"
                  value={inputs.revenuePerHectare}
                  onChange={(e) => updateInput("revenuePerHectare", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="border-t border-border pt-6">
          <h3 className="font-semibold mb-4">Tulemused</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* ROI */}
            <div className="rounded-lg bg-primary/10 p-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">ROI</span>
              </div>
              <div className="text-2xl font-bold">
                {formatNumber(calculations.roi, 0)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Kogu eluea jooksul
              </div>
            </div>

            {/* Payback Period */}
            <div className="rounded-lg bg-accent/50 p-4">
              <div className="flex items-center gap-2 text-accent-foreground mb-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Tasuvusaeg</span>
              </div>
              <div className="text-2xl font-bold">
                {calculations.paybackYears === Infinity
                  ? "—"
                  : `${formatNumber(calculations.paybackYears)} a`}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Investeeringu tagasi
              </div>
            </div>

            {/* Cost per Hectare */}
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Fuel className="h-4 w-4" />
                <span className="text-sm font-medium">Kulu hektari kohta</span>
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(calculations.costPerHectare)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                €/ha aastas
              </div>
            </div>

            {/* Annual Profit */}
            <div
              className={`rounded-lg p-4 ${
                calculations.annualProfit >= 0
                  ? "bg-green-500/10"
                  : "bg-destructive/10"
              }`}
            >
              <div
                className={`flex items-center gap-2 mb-2 ${
                  calculations.annualProfit >= 0
                    ? "text-green-600"
                    : "text-destructive"
                }`}
              >
                <Wrench className="h-4 w-4" />
                <span className="text-sm font-medium">Aastane kasum</span>
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(calculations.annualProfit)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Tulu - kulud
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <h4 className="font-medium mb-3">Aastased kulud</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kütus</span>
                  <span>{formatCurrency(calculations.annualFuelCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Operaator</span>
                  <span>{formatCurrency(calculations.annualOperatorCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hooldus</span>
                  <span>{formatCurrency(inputs.annualMaintenance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amortisatsioon</span>
                  <span>{formatCurrency(calculations.annualDepreciation)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-medium">
                  <span>Kokku</span>
                  <span>{formatCurrency(calculations.totalAnnualCosts)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border p-4">
              <h4 className="font-medium mb-3">Kokkuvõte</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aastane tulu</span>
                  <span>{formatCurrency(calculations.annualRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aastane kulu</span>
                  <span>{formatCurrency(calculations.totalAnnualCosts)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kulu tunni kohta</span>
                  <span>{formatCurrency(calculations.costPerHour)}/h</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-medium">
                  <span>Kogu omamiskulu ({inputs.expectedLifespan}a)</span>
                  <span>{formatCurrency(calculations.totalLifetimeCosts)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
