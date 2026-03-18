import { useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Tractor, Fuel, Cog, Wheat, PiggyBank, TrendingUp, Droplets, Circle } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

// Equipment type category for ROI quality section
export type ROIEquipmentCategory = "combine" | "sprayer" | "baler" | "none";

export function getROIEquipmentCategory(equipmentTypeName?: string): ROIEquipmentCategory {
  if (!equipmentTypeName) return "combine"; // default
  const name = equipmentTypeName.toLowerCase().replace(/_/g, " ");
  if (name.includes("combine") || name.includes("kombain") || name.includes("forage") || name.includes("heksel")) return "combine";
  if (name.includes("sprayer") || name.includes("prits") || name.includes("taimekait")) return "sprayer";
  if (name.includes("baler") || name.includes("ruloon") || name.includes("press")) return "baler";
  // tractor, telehandler, wheel loader → no quality section
  return "none";
}

export interface ROIInputs {
  // Machine name
  machineName: string;
  
  // Purchase & depreciation
  purchasePrice: number;
  expectedLifespan: number;
  residualValuePercent: number;
  
  // Operating parameters
  annualWorkHours: number;
  annualHectares: number;
  
  // Fuel
  fuelConsumption: number;
  fuelPrice: number;
  fuelSavingsPercent: number;
  
  // Maintenance
  annualMaintenance: number;
  maintenanceSavingsPercent: number;
  
  // Harvest quality (combine)
  grainLossReduction: number;
  
  // Sprayer fields
  chemicalCostPerHa: number;
  overlapPercent: number;
  sprayAreaHa: number;
  
  // Baler fields
  balesPerYear: number;
  wrapCostPerBale: number;
  handlingCostPerBale: number;
  densityIncreasePercent: number;
  
  // Labor
  operatorHourlyCost: number;
  
  // Revenue
  revenuePerHectare: number;
}

export interface ROICalculations {
  grainLossSavings: number;
  fuelSavings: number;
  maintenanceSavings: number;
  qualitySavings: number; // dynamic section savings
  qualitySavingsLabel: string;
  totalAnnualBenefits: number;
  baseFuelCost: number;
  actualFuelCost: number;
  actualMaintenanceCost: number;
  operatorCost: number;
  annualDepreciation: number;
  totalAnnualCosts: number;
  netAnnualOwnershipCost: number;
  residualValue: number;
  annualRevenue: number;
  annualProfit: number;
  costPerHectare: number;
  costPerHour: number;
  totalLifetimeBenefits: number;
  roi: number;
  paybackYears: number;
  profitBasedPayback: number;
  totalLifetimeCosts: number;
}

export const defaultInputsExisting: ROIInputs = {
  machineName: "Olemasolev masin",
  purchasePrice: 350000,
  expectedLifespan: 5,
  residualValuePercent: 40,
  annualWorkHours: 400,
  annualHectares: 800,
  fuelConsumption: 50,
  fuelPrice: 1.5,
  fuelSavingsPercent: 0,
  annualMaintenance: 18000,
  maintenanceSavingsPercent: 0,
  grainLossReduction: 0,
  // Sprayer defaults
  chemicalCostPerHa: 50,
  overlapPercent: 10,
  sprayAreaHa: 2000,
  // Baler defaults
  balesPerYear: 5000,
  wrapCostPerBale: 3,
  handlingCostPerBale: 5,
  densityIncreasePercent: 0,
  operatorHourlyCost: 25,
  revenuePerHectare: 150,
};

export const defaultInputsNew: ROIInputs = {
  machineName: "Uus masin",
  purchasePrice: 500000,
  expectedLifespan: 5,
  residualValuePercent: 52,
  annualWorkHours: 400,
  annualHectares: 800,
  fuelConsumption: 45,
  fuelPrice: 1.5,
  fuelSavingsPercent: 5,
  annualMaintenance: 12000,
  maintenanceSavingsPercent: 25,
  grainLossReduction: 3,
  // Sprayer defaults
  chemicalCostPerHa: 50,
  overlapPercent: 2,
  sprayAreaHa: 2000,
  // Baler defaults
  balesPerYear: 5000,
  wrapCostPerBale: 3,
  handlingCostPerBale: 5,
  densityIncreasePercent: 15,
  operatorHourlyCost: 25,
  revenuePerHectare: 150,
};

export function calculateROI(inputs: ROIInputs, category: ROIEquipmentCategory = "combine"): ROICalculations {
  const baseFuelCost = inputs.annualWorkHours * inputs.fuelConsumption * inputs.fuelPrice;
  const baseMaintenanceCost = inputs.annualMaintenance;
  
  const fuelSavings = baseFuelCost * (inputs.fuelSavingsPercent / 100);
  const maintenanceSavings = baseMaintenanceCost * (inputs.maintenanceSavingsPercent / 100);
  
  // Quality/type-specific savings
  let qualitySavings = 0;
  let qualitySavingsLabel = "";
  
  if (category === "combine") {
    qualitySavings = inputs.grainLossReduction * inputs.annualHectares;
    qualitySavingsLabel = "Terakadudelt";
  } else if (category === "sprayer") {
    // No comparison between machines - just this machine's overlap waste
    qualitySavings = inputs.sprayAreaHa * inputs.chemicalCostPerHa * (inputs.overlapPercent / 100);
    // For comparison, the difference is handled by comparing two calculators
    qualitySavingsLabel = "Keemialt (ülekate)";
  } else if (category === "baler") {
    const fewerBales = inputs.balesPerYear * (inputs.densityIncreasePercent / 100);
    qualitySavings = fewerBales * (inputs.wrapCostPerBale + inputs.handlingCostPerBale);
    qualitySavingsLabel = "Tiheduselt";
  }
  
  // For "none" category, grainLossSavings stays 0
  const grainLossSavings = qualitySavings; // backward compat
  
  const totalAnnualBenefits = fuelSavings + maintenanceSavings + qualitySavings;
  
  const actualFuelCost = baseFuelCost - fuelSavings;
  const actualMaintenanceCost = baseMaintenanceCost - maintenanceSavings;
  const operatorCost = inputs.annualWorkHours * inputs.operatorHourlyCost;
  
  const residualValue = inputs.purchasePrice * (inputs.residualValuePercent / 100);
  const annualDepreciation = (inputs.purchasePrice - residualValue) / inputs.expectedLifespan;
  
  const totalAnnualCosts = actualFuelCost + actualMaintenanceCost + operatorCost + annualDepreciation;
  const netAnnualOwnershipCost = annualDepreciation - totalAnnualBenefits;
  
  const annualRevenue = inputs.annualHectares * inputs.revenuePerHectare;
  const annualProfit = annualRevenue - totalAnnualCosts;
  
  const costPerHectare = inputs.annualHectares > 0 ? totalAnnualCosts / inputs.annualHectares : 0;
  const costPerHour = inputs.annualWorkHours > 0 ? totalAnnualCosts / inputs.annualWorkHours : 0;
  
  const totalLifetimeBenefits = totalAnnualBenefits * inputs.expectedLifespan;
  const roi = inputs.purchasePrice > 0 ? (totalLifetimeBenefits / inputs.purchasePrice) * 100 : 0;
  
  const paybackYears = totalAnnualBenefits > 0 ? inputs.purchasePrice / totalAnnualBenefits : Infinity;
  const profitBasedPayback = annualProfit > 0 ? inputs.purchasePrice / annualProfit : Infinity;
  
  const totalLifetimeCosts = totalAnnualCosts * inputs.expectedLifespan;

  return {
    grainLossSavings,
    fuelSavings,
    maintenanceSavings,
    qualitySavings,
    qualitySavingsLabel,
    totalAnnualBenefits,
    baseFuelCost,
    actualFuelCost,
    actualMaintenanceCost,
    operatorCost,
    annualDepreciation,
    totalAnnualCosts,
    netAnnualOwnershipCost,
    residualValue,
    annualRevenue,
    annualProfit,
    costPerHectare,
    costPerHour,
    totalLifetimeBenefits,
    roi,
    paybackYears,
    profitBasedPayback,
    totalLifetimeCosts,
  };
}

interface SingleROICalculatorProps {
  inputs: ROIInputs;
  onInputChange: (key: keyof ROIInputs, value: string | number) => void;
  variant: "existing" | "new";
  title: string;
  equipmentCategory?: ROIEquipmentCategory;
}

export function SingleROICalculator({ 
  inputs, 
  onInputChange, 
  variant,
  title,
  equipmentCategory = "combine",
}: SingleROICalculatorProps) {
  const [openSections, setOpenSections] = useState({
    purchase: true,
    work: false,
    fuel: false,
    maintenance: false,
    quality: false,
    revenue: false,
  });

  const calculations = useMemo(() => calculateROI(inputs, equipmentCategory), [inputs, equipmentCategory]);

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

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Smart residual value defaults based on machine name
  useEffect(() => {
    const name = inputs.machineName.toLowerCase();
    if (variant === "new" && name.includes("john deere")) {
      if (inputs.residualValuePercent !== 52) {
        onInputChange("residualValuePercent", 52);
      }
    } else if (variant === "existing" && !name.includes("john deere") && name !== "olemasolev masin" && name.length > 3) {
      if (inputs.residualValuePercent !== 40 && inputs.residualValuePercent === defaultInputsExisting.residualValuePercent) {
        // Only auto-set if still at default
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs.machineName]);

  const accentColor = variant === "new" ? "text-primary" : "text-muted-foreground";
  const accentBg = variant === "new" ? "bg-primary/10" : "bg-muted";
  const borderColor = variant === "new" ? "border-primary/30" : "border-border";

  // Quality section config based on equipment category
  const qualitySectionConfig = useMemo(() => {
    switch (equipmentCategory) {
      case "combine":
        return {
          title: "Koristuse kvaliteet",
          icon: Wheat,
          visible: true,
        };
      case "sprayer":
        return {
          title: "Pritsimise täpsus ja keemia",
          icon: Droplets,
          visible: true,
        };
      case "baler":
        return {
          title: "Rulli tihedus ja materjalikulu",
          icon: Circle,
          visible: true,
        };
      case "none":
      default:
        return {
          title: "",
          icon: Wheat,
          visible: false,
        };
    }
  }, [equipmentCategory]);

  const renderQualityFields = () => {
    if (equipmentCategory === "combine") {
      return (
        <div className="space-y-1">
          <Label htmlFor={`${variant}-grainLossReduction`} className="text-xs">Terakadude vähenemine (€/ha)</Label>
          <Input
            id={`${variant}-grainLossReduction`}
            type="number"
            step="0.5"
            value={inputs.grainLossReduction || ""}
            onChange={(e) => onInputChange("grainLossReduction", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      );
    }
    
    if (equipmentCategory === "sprayer") {
      return (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor={`${variant}-chemicalCostPerHa`} className="text-xs">Keemia kulu (€/ha)</Label>
            <Input
              id={`${variant}-chemicalCostPerHa`}
              type="number"
              value={inputs.chemicalCostPerHa || ""}
              onChange={(e) => onInputChange("chemicalCostPerHa", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${variant}-overlapPercent`} className="text-xs">Ülekate (%)</Label>
            <Input
              id={`${variant}-overlapPercent`}
              type="number"
              step="0.5"
              value={inputs.overlapPercent || ""}
              onChange={(e) => onInputChange("overlapPercent", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${variant}-sprayAreaHa`} className="text-xs">Pritsitav pind aastas (ha)</Label>
            <Input
              id={`${variant}-sprayAreaHa`}
              type="number"
              value={inputs.sprayAreaHa || ""}
              onChange={(e) => onInputChange("sprayAreaHa", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
      );
    }
    
    if (equipmentCategory === "baler") {
      return (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor={`${variant}-balesPerYear`} className="text-xs">Rullide arv aastas (tk)</Label>
            <Input
              id={`${variant}-balesPerYear`}
              type="number"
              value={inputs.balesPerYear || ""}
              onChange={(e) => onInputChange("balesPerYear", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={`${variant}-wrapCostPerBale`} className="text-xs">Kile/võrgu kulu (€/rull)</Label>
              <Input
                id={`${variant}-wrapCostPerBale`}
                type="number"
                step="0.5"
                value={inputs.wrapCostPerBale || ""}
                onChange={(e) => onInputChange("wrapCostPerBale", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${variant}-handlingCostPerBale`} className="text-xs">Transpordi kulu (€/rull)</Label>
              <Input
                id={`${variant}-handlingCostPerBale`}
                type="number"
                step="0.5"
                value={inputs.handlingCostPerBale || ""}
                onChange={(e) => onInputChange("handlingCostPerBale", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${variant}-densityIncreasePercent`} className="text-xs">Tiheduse suurenemine (%)</Label>
            <Input
              id={`${variant}-densityIncreasePercent`}
              type="number"
              value={inputs.densityIncreasePercent || ""}
              onChange={(e) => onInputChange("densityIncreasePercent", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className={`rounded-xl border-2 ${borderColor} p-4 space-y-4`}>
      {/* Header */}
      <div className={`flex items-center gap-2 pb-2 border-b ${borderColor}`}>
        <Tractor className={`h-5 w-5 ${accentColor}`} />
        <h3 className={`font-bold ${accentColor}`}>{title}</h3>
      </div>

      {/* Machine Name Input */}
      <div className="space-y-1.5">
        <Label htmlFor={`${variant}-machineName`} className="text-sm font-medium">
          Masina nimi
        </Label>
        <Input
          id={`${variant}-machineName`}
          type="text"
          value={inputs.machineName || ""}
          onChange={(e) => onInputChange("machineName", e.target.value)}
          className="h-9"
        />
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-2">
        {/* Section 1: Soetamine */}
        <Collapsible open={openSections.purchase} onOpenChange={() => toggleSection("purchase")}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
            <span className="flex items-center gap-2 text-sm font-medium">
              <DollarSign className="h-4 w-4" />
              Soetamine & Jääkväärtus
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.purchase ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            <div className="grid gap-2">
              <div className="space-y-1">
                <Label htmlFor={`${variant}-purchasePrice`} className="text-xs">Ostuhind (€)</Label>
                <Input
                  id={`${variant}-purchasePrice`}
                  type="number"
                  value={inputs.purchasePrice || ""}
                  onChange={(e) => onInputChange("purchasePrice", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor={`${variant}-expectedLifespan`} className="text-xs">Periood (a)</Label>
                  <Input
                    id={`${variant}-expectedLifespan`}
                    type="number"
                    value={inputs.expectedLifespan || ""}
                    onChange={(e) => onInputChange("expectedLifespan", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`${variant}-residualValuePercent`} className="text-xs">Jääkväärtus (%)</Label>
                  <Input
                    id={`${variant}-residualValuePercent`}
                    type="number"
                    value={inputs.residualValuePercent || ""}
                    onChange={(e) => onInputChange("residualValuePercent", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Section 2: Töö parameetrid */}
        <Collapsible open={openSections.work} onOpenChange={() => toggleSection("work")}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Tractor className="h-4 w-4" />
              Töö parameetrid
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.work ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            <div className={`grid gap-2 ${equipmentCategory === "none" ? "grid-cols-1" : "grid-cols-2"}`}>
              {equipmentCategory !== "none" && (
                <div className="space-y-1">
                  <Label htmlFor={`${variant}-annualHectares`} className="text-xs">Hektarid/a</Label>
                  <Input
                    id={`${variant}-annualHectares`}
                    type="number"
                    value={inputs.annualHectares || ""}
                    onChange={(e) => onInputChange("annualHectares", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor={`${variant}-annualWorkHours`} className="text-xs">Töötunnid/a</Label>
                <Input
                  id={`${variant}-annualWorkHours`}
                  type="number"
                  value={inputs.annualWorkHours || ""}
                  onChange={(e) => onInputChange("annualWorkHours", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${variant}-operatorHourlyCost`} className="text-xs">Operaatori €/h</Label>
              <Input
                id={`${variant}-operatorHourlyCost`}
                type="number"
                value={inputs.operatorHourlyCost || ""}
                onChange={(e) => onInputChange("operatorHourlyCost", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Section 3: Kütus */}
        <Collapsible open={openSections.fuel} onOpenChange={() => toggleSection("fuel")}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Fuel className="h-4 w-4" />
              Kütus
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.fuel ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor={`${variant}-fuelConsumption`} className="text-xs">Kulu (l/h)</Label>
                <Input
                  id={`${variant}-fuelConsumption`}
                  type="number"
                  step="0.1"
                  value={inputs.fuelConsumption || ""}
                  onChange={(e) => onInputChange("fuelConsumption", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${variant}-fuelPrice`} className="text-xs">Hind (€/l)</Label>
                <Input
                  id={`${variant}-fuelPrice`}
                  type="number"
                  step="0.01"
                  value={inputs.fuelPrice || ""}
                  onChange={(e) => onInputChange("fuelPrice", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${variant}-fuelSavingsPercent`} className="text-xs">Sääst optimeerimisest (%)</Label>
              <Input
                id={`${variant}-fuelSavingsPercent`}
                type="number"
                value={inputs.fuelSavingsPercent || ""}
                onChange={(e) => onInputChange("fuelSavingsPercent", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Section 4: Hooldus */}
        <Collapsible open={openSections.maintenance} onOpenChange={() => toggleSection("maintenance")}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Cog className="h-4 w-4" />
              Hooldus
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.maintenance ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            <div className="space-y-1">
              <Label htmlFor={`${variant}-annualMaintenance`} className="text-xs">Hoolduskulu aastas (€)</Label>
              <Input
                id={`${variant}-annualMaintenance`}
                type="number"
                value={inputs.annualMaintenance || ""}
                onChange={(e) => onInputChange("annualMaintenance", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${variant}-maintenanceSavingsPercent`} className="text-xs">Sääst ennetavast hooldusest (%)</Label>
              <Input
                id={`${variant}-maintenanceSavingsPercent`}
                type="number"
                value={inputs.maintenanceSavingsPercent || ""}
                onChange={(e) => onInputChange("maintenanceSavingsPercent", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Section 5: Dynamic Quality Section */}
        {qualitySectionConfig.visible && (
          <Collapsible open={openSections.quality} onOpenChange={() => toggleSection("quality")}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <span className="flex items-center gap-2 text-sm font-medium">
                <qualitySectionConfig.icon className="h-4 w-4" />
                {qualitySectionConfig.title}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections.quality ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-2">
              {renderQualityFields()}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Section 6: Tulu */}
        <Collapsible open={openSections.revenue} onOpenChange={() => toggleSection("revenue")}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
            <span className="flex items-center gap-2 text-sm font-medium">
              <PiggyBank className="h-4 w-4" />
              Tulu
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.revenue ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            <div className="space-y-1">
              <Label htmlFor={`${variant}-revenuePerHectare`} className="text-xs">Tulu hektari kohta (€/ha)</Label>
              <Input
                id={`${variant}-revenuePerHectare`}
                type="number"
                value={inputs.revenuePerHectare || ""}
                onChange={(e) => onInputChange("revenuePerHectare", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Results Summary */}
      <div className={`rounded-lg ${accentBg} p-3 space-y-2`}>
        <h4 className={`font-semibold text-sm ${accentColor} flex items-center gap-2`}>
          <TrendingUp className="h-4 w-4" />
          Tulemused
        </h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">TCO ({inputs.expectedLifespan}a)</span>
            <div className="font-bold">{formatCurrency(calculations.totalLifetimeCosts)}</div>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">ROI</span>
            <div className="font-bold">{formatNumber(calculations.roi, 0)}%</div>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Kulu/ha</span>
            <div className="font-bold">{formatCurrency(calculations.costPerHectare)}</div>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Aastane kasum</span>
            <div className={`font-bold ${calculations.annualProfit >= 0 ? "text-green-600" : "text-destructive"}`}>
              {formatCurrency(calculations.annualProfit)}
            </div>
          </div>
        </div>
        <div className="pt-2 border-t border-border/50">
          <span className="text-muted-foreground text-xs">Aastane kogusääst</span>
          <div className="font-bold text-green-600">+{formatCurrency(calculations.totalAnnualBenefits)}</div>
          {/* Savings breakdown */}
          <div className="mt-1 space-y-0.5">
            {calculations.fuelSavings > 0 && (
              <div className="text-xs text-muted-foreground">
                Kütuselt: {formatCurrency(calculations.fuelSavings)}
              </div>
            )}
            {calculations.maintenanceSavings > 0 && (
              <div className="text-xs text-muted-foreground">
                Hoolduselt: {formatCurrency(calculations.maintenanceSavings)}
              </div>
            )}
            {calculations.qualitySavings > 0 && calculations.qualitySavingsLabel && (
              <div className="text-xs text-muted-foreground">
                {calculations.qualitySavingsLabel}: {formatCurrency(calculations.qualitySavings)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
